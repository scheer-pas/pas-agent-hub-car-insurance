import { Body, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBody, ApiResponse, PasController } from '@pas/service-nestjs-api';
import { injectLogger } from '@pas/api';
import { inject } from '@pas/module';
import { ParseValidatorPipe } from '@pas/service-nestjs-common';
import type { AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import {
  agentResponseSchema,
  agentStreamRequestSchema,
} from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import type { Response } from 'express';
import { CarInsuranceAgentStream } from './car-insurance-agent-stream';

/** The content type a streamed answer is sent with. */
const ANSWER_CONTENT_TYPE = 'text/plain; charset=utf-8';

/**
 * Serves the Car Insurance agent under `/car-insurance`.
 */
@PasController({ path: 'car-insurance' })
export class CarInsuranceController {
  private logger = injectLogger('carinsurance.controller');
  private agentStream = inject(CarInsuranceAgentStream);

  /**
   * Answers a text prompt with attachments. The answer is written to the
   * response as plain text, part by part, while the agent produces it.
   *
   * A failure before the first part is reported as an error response. A
   * failure after the first part aborts the response. When the caller closes
   * the connection, the answer is no longer produced.
   * @param body The text prompt and its attachments.
   * @param response The response the answer is written to.
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: agentStreamRequestSchema })
  @ApiResponse({ status: 200, schema: agentResponseSchema })
  public async ask(
    @Body(new ParseValidatorPipe(agentStreamRequestSchema))
    body: AgentStreamRequest,
    @Res() response: Response,
  ): Promise<void> {
    let isClosed = false;
    response.on('close', () => {
      isClosed = true;
    });

    try {
      for await (const part of this.agentStream.answer(body)) {
        // Leaving the loop ends the answer, which stops the agent.
        if (isClosed) {
          return;
        }
        this.writePart(response, part);
      }
    } catch (error) {
      // Before the first part the status can still be set, so the error
      // response is left to the framework.
      if (!response.headersSent) {
        throw error;
      }
      this.logger.error('The answer broke off after it started', error);
      response.destroy();
      return;
    }

    if (!response.headersSent) {
      response.setHeader('Content-Type', ANSWER_CONTENT_TYPE);
    }
    response.end();
  }

  /**
   * Writes one part of the answer. The content type is set with the first
   * part, so a failure before it is answered as an error.
   * @param response The response the answer is written to.
   * @param part The part to write.
   */
  private writePart(response: Response, part: string): void {
    if (!response.headersSent) {
      response.setHeader('Content-Type', ANSWER_CONTENT_TYPE);
    }
    response.write(part);
  }
}
