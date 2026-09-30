import { agentStreamRequestSchema } from './agent-stream-request';

describe('agentStreamRequestSchema', () => {
  const attachment = {
    name: 'front.jpg',
    type: 'image/jpeg',
    data: '/9j/4A==',
  };

  it('accepts a text prompt without attachments', () => {
    expect(agentStreamRequestSchema.safeParse({ text: 'Hi' }).success).toBe(
      true,
    );
  });

  it('accepts up to 10 attachments and ignores unknown fields', () => {
    const result = agentStreamRequestSchema.safeParse({
      text: 'Hi',
      attachments: Array.from({ length: 10 }, () => attachment),
      extra: true,
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ['an empty text', { text: '' }],
    ['a missing text', { attachments: [] }],
    [
      '11 attachments',
      { text: 'Hi', attachments: Array.from({ length: 11 }, () => attachment) },
    ],
    [
      'an unsupported file type',
      { text: 'Hi', attachments: [{ ...attachment, type: 'application/pdf' }] },
    ],
    [
      'an empty file name',
      { text: 'Hi', attachments: [{ ...attachment, name: '' }] },
    ],
    [
      'content that is not base64',
      { text: 'Hi', attachments: [{ ...attachment, data: 'not base64!' }] },
    ],
  ])('rejects %s', (_label, body) => {
    expect(agentStreamRequestSchema.safeParse(body).success).toBe(false);
  });
});
