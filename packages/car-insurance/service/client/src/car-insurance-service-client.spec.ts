import { Axios, AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import type { AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';
import { CarInsuranceServiceClient } from './car-insurance-service-client';

describe('CarInsuranceServiceClient', () => {
  const request: AgentStreamRequest = {
    text: 'Summarize the damage',
    attachments: [{ name: 'front.jpg', type: 'image/jpeg', data: '/9j/4A==' }],
  };

  let post: jest.Mock;
  let client: CarInsuranceServiceClient;

  /**
   * Returns the request configuration the client passed to the last post.
   * @returns The configuration.
   */
  const lastConfig = (): AxiosRequestConfig => post.mock.calls[0][2];

  /**
   * Builds a progress event whose request holds the given response text.
   * @param responseText The text received so far.
   * @returns The event.
   */
  const progressEvent = (responseText: unknown): AxiosProgressEvent =>
    ({
      event: { target: { responseText } },
    }) as unknown as AxiosProgressEvent;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: 'The bumper is dented.' });
    client = new CarInsuranceServiceClient({ post } as unknown as Axios);
  });

  it('posts the request to car-insurance/ask as text and returns the answer', async () => {
    await expect(client.streamAgent(request)).resolves.toBe(
      'The bumper is dented.',
    );

    expect(post).toHaveBeenCalledWith(
      'car-insurance/ask',
      request,
      expect.objectContaining({ responseType: 'text' }),
    );
  });

  it('reports the answer received so far', async () => {
    const onProgress = jest.fn();
    await client.streamAgent(request, onProgress);

    lastConfig().onDownloadProgress?.(progressEvent('The bumper '));

    expect(onProgress).toHaveBeenCalledWith('The bumper ');
  });

  it('reports nothing when the event carries no response text', async () => {
    const onProgress = jest.fn();
    await client.streamAgent(request, onProgress);

    lastConfig().onDownloadProgress?.(progressEvent(undefined));
    lastConfig().onDownloadProgress?.({} as AxiosProgressEvent);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it('ignores progress when no callback is given', async () => {
    await client.streamAgent(request);

    expect(() =>
      lastConfig().onDownloadProgress?.(progressEvent('The bumper ')),
    ).not.toThrow();
  });
});
