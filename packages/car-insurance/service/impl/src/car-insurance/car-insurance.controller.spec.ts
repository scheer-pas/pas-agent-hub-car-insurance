import { RequestMethod } from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { LoggerService } from '@pas/api';
import { Injector, runInInjectionContext } from '@pas/module';
import type { AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import type { Response } from 'express';
import { CarInsuranceAgentStream } from './car-insurance-agent-stream';
import { CarInsuranceController } from './car-insurance.controller';
import 'reflect-metadata';

/** The parts of a response the controller uses. */
interface ResponseStub {
  headersSent: boolean;
  setHeader: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
  destroy: jest.Mock;
  on: jest.Mock;
}

describe('CarInsuranceController', () => {
  const logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const request: AgentStreamRequest = {
    text: 'Summarize the damage',
    attachments: [{ name: 'front.jpg', type: 'image/jpeg', data: '/9j/4A==' }],
  };

  let agentStream: { answer: jest.Mock };
  let response: ResponseStub;
  /** Simulates the caller closing the connection. */
  let closeConnection: () => void;

  /**
   * Builds the controller with its dependencies resolved from a local injector.
   */
  const createController = (): CarInsuranceController => {
    const injector = new Injector({
      providers: [
        {
          provide: LoggerService,
          useValue: { withLogger: () => logger, getLogger: () => logger },
        },
        { provide: CarInsuranceAgentStream, useValue: agentStream },
      ],
    });
    return runInInjectionContext(injector, () => new CarInsuranceController());
  };

  /**
   * Returns a generator that yields the given parts, then throws the given
   * error if one is passed.
   * @param parts The parts to yield.
   * @param error The error to throw after the parts.
   * @returns The generator.
   */
  async function* partsOf(
    parts: string[],
    error?: Error,
  ): AsyncGenerator<string> {
    for (const part of parts) {
      yield part;
    }
    if (error) {
      throw error;
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    agentStream = { answer: jest.fn() };
    response = {
      headersSent: false,
      setHeader: jest.fn(),
      write: jest.fn(() => {
        response.headersSent = true;
        return true;
      }),
      end: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'close') {
          closeConnection = handler;
        }
      }),
    };
  });

  it('serves the streamed answer as a POST route on car-insurance/ask', () => {
    const handler = CarInsuranceController.prototype.ask;

    expect(Reflect.getMetadata(PATH_METADATA, CarInsuranceController)).toBe(
      'car-insurance',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('ask');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
  });

  it('writes every part of the answer as plain text, then ends the response', async () => {
    agentStream.answer.mockReturnValue(partsOf(['The bumper ', 'is dented.']));

    await createController().ask(request, response as unknown as Response);

    expect(agentStream.answer).toHaveBeenCalledWith(request);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; charset=utf-8',
    );
    expect(response.write.mock.calls).toEqual([
      ['The bumper '],
      ['is dented.'],
    ]);
    expect(response.end).toHaveBeenCalled();
  });

  it('rethrows a failure that happens before the first part', async () => {
    const failure = new Error('model unavailable');
    agentStream.answer.mockReturnValue(partsOf([], failure));

    await expect(
      createController().ask(request, response as unknown as Response),
    ).rejects.toBe(failure);
    expect(response.end).not.toHaveBeenCalled();
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('stops the answer when the caller closes the connection', async () => {
    let isAnswerEnded = false;
    agentStream.answer.mockReturnValue(
      (async function* (): AsyncGenerator<string> {
        try {
          yield 'The bumper ';
          closeConnection();
          yield 'is dented.';
          yield ' The door is scratched.';
        } finally {
          isAnswerEnded = true;
        }
      })(),
    );

    await createController().ask(request, response as unknown as Response);

    expect(response.write.mock.calls).toEqual([['The bumper ']]);
    expect(isAnswerEnded).toBe(true);
    expect(response.end).not.toHaveBeenCalled();
  });

  it('aborts the response on a failure after the first part', async () => {
    agentStream.answer.mockReturnValue(
      partsOf(['The bumper '], new Error('lost')),
    );

    await createController().ask(request, response as unknown as Response);

    expect(response.destroy).toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
