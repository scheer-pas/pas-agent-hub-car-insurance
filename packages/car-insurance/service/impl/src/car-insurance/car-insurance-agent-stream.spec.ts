import { Injector, runInInjectionContext } from '@pas/module';
import type { AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import { AIMessageChunk, BaseMessage, ToolMessage } from 'langchain';
import { CarInsuranceAgent } from './car-insurance.agent';
import { CarInsuranceAgentStream } from './car-insurance-agent-stream';
import { CarInsuranceAttachments } from './car-insurance-attachments';

describe('CarInsuranceAgentStream', () => {
  let agent: { stream: jest.Mock };

  /**
   * Builds the stream with the agent stub and the real attachment converter
   * resolved from a local injector.
   */
  const createStream = (): CarInsuranceAgentStream => {
    const injector = new Injector({
      providers: [
        { provide: CarInsuranceAgent, useValue: agent },
        {
          provide: CarInsuranceAttachments,
          useValue: new CarInsuranceAttachments(),
        },
      ],
    });
    return runInInjectionContext(injector, () => new CarInsuranceAgentStream());
  };

  /**
   * Returns an async generator that yields the given messages.
   * @param messages The messages to yield.
   * @returns The generator.
   */
  async function* streamOf(
    messages: BaseMessage[],
  ): AsyncGenerator<BaseMessage> {
    for (const message of messages) {
      yield message;
    }
  }

  /**
   * Collects every part the stream yields for a request.
   * @param stream The stream to ask.
   * @param request The request to answer.
   * @returns The parts, in order.
   */
  const collect = async (
    stream: CarInsuranceAgentStream,
    request: AgentStreamRequest,
  ): Promise<string[]> => {
    const parts: string[] = [];
    for await (const part of stream.answer(request)) {
      parts.push(part);
    }
    return parts;
  };

  beforeEach(() => {
    agent = { stream: jest.fn() };
  });

  it('sends the text prompt and each attachment as a content block', async () => {
    agent.stream.mockResolvedValue(streamOf([]));

    await collect(createStream(), {
      text: 'Summarize the damage',
      attachments: [
        { name: 'front.jpg', type: 'image/jpeg', data: '/9j/4A==' },
      ],
    });

    expect(agent.stream).toHaveBeenCalledWith({
      input: { text: 'Summarize the damage' },
      attachments: [
        { type: 'image', mimeType: 'image/jpeg', data: '/9j/4A==' },
      ],
    });
  });

  it('sends no attachments when the request has none', async () => {
    agent.stream.mockResolvedValue(streamOf([]));

    await collect(createStream(), { text: 'Hello' });

    expect(agent.stream).toHaveBeenCalledWith({
      input: { text: 'Hello' },
      attachments: [],
    });
  });

  it('yields the text of the answer parts in order', async () => {
    agent.stream.mockResolvedValue(
      streamOf([
        new AIMessageChunk({ content: 'The bumper ' }),
        new AIMessageChunk({ content: 'is dented.' }),
      ]),
    );

    expect(await collect(createStream(), { text: 'Hello' })).toEqual([
      'The bumper ',
      'is dented.',
    ]);
  });

  it('skips messages that are not answer parts and empty parts', async () => {
    agent.stream.mockResolvedValue(
      streamOf([
        new ToolMessage({ content: 'tool output', tool_call_id: '1' }),
        new AIMessageChunk({ content: '' }),
        new AIMessageChunk({ content: 'Answer' }),
      ]),
    );

    expect(await collect(createStream(), { text: 'Hello' })).toEqual([
      'Answer',
    ]);
  });
});
