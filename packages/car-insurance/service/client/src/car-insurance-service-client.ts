import { Axios, AxiosProgressEvent } from 'axios';
import type {
  AgentResponse,
  AgentStreamRequest,
} from '@pas-agent-hub-car-insurance/car-insurance-service-types';

/**
 * Receives the answer produced so far while an agent answer is streamed.
 */
export type AgentAnswerProgress = (answerSoFar: AgentResponse) => void;

/**
 * Calls the car insurance service. The address of the service comes from the
 * configuration of the app.
 */
export class CarInsuranceServiceClient {
  /**
   * @param axios The HTTP client, configured with the address of the service.
   */
  public constructor(private readonly axios: Axios) {}

  /**
   * Sends a text prompt with attachments to the agent and streams its answer.
   * @param input The text prompt and its attachments.
   * @param onProgress Called with the answer produced so far each time a part
   *   of it arrives. Only called where the transport reports partial responses,
   *   as it does in the browser.
   * @returns The complete answer.
   */
  public async streamAgent(
    input: AgentStreamRequest,
    onProgress?: AgentAnswerProgress,
  ): Promise<AgentResponse> {
    const response = await this.axios.post<AgentResponse>(
      'car-insurance/ask',
      input,
      {
        responseType: 'text',
        onDownloadProgress: (event) => this.reportProgress(event, onProgress),
      },
    );
    return response.data;
  }

  /**
   * Passes the answer received so far to the progress callback.
   * @param event The download progress event of the request.
   * @param onProgress The callback to pass the answer to.
   */
  private reportProgress(
    event: AxiosProgressEvent,
    onProgress?: AgentAnswerProgress,
  ): void {
    // In the browser the event carries the request, whose response text holds
    // everything received so far.
    const request = event.event?.target as XMLHttpRequest | undefined;
    if (!onProgress || typeof request?.responseText !== 'string') {
      return;
    }
    onProgress(request.responseText);
  }
}
