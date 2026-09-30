import { ProgressReportMessage } from '@pas/agent-api';
import { inject } from '@pas/module';
import type { AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import { BaseMessage } from 'langchain';
import { CarInsuranceAgent } from './car-insurance.agent';
import { CarInsuranceAttachments } from './car-insurance-attachments';

/** The message type of a part of the agent's answer. */
const ANSWER_MESSAGE_TYPE = 'ai';

/**
 * Answers a text prompt with attachments with the Car Insurance agent, part
 * by part.
 */
export class CarInsuranceAgentStream {
  private readonly agent = inject(CarInsuranceAgent);
  private readonly attachments = inject(CarInsuranceAttachments);
  private readonly progressReports = new ProgressReportMessage();

  /**
   * Asks the agent and yields the answer in parts, as the agent produces them.
   * @param request The text prompt and its attachments.
   * @returns The parts of the answer, in order.
   */
  public async *answer(request: AgentStreamRequest): AsyncGenerator<string> {
    const stream = await this.agent.stream({
      input: { text: request.text },
      attachments: this.attachments.toContentBlocks(request.attachments ?? []),
    });

    for await (const message of stream) {
      const text = this.answerText(message);
      if (text) {
        yield text;
      }
    }
  }

  /**
   * Returns the text a streamed message adds to the answer.
   * @param message A message of the agent's stream.
   * @returns The text of an answer part, or an empty string for any other message.
   */
  private answerText(message: BaseMessage): string {
    if (this.progressReports.read(message)) {
      return '';
    }
    if (message.type !== ANSWER_MESSAGE_TYPE) {
      return '';
    }
    return message.text;
  }
}
