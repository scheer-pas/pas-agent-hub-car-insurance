import { z } from 'zod';
import { AttachmentKinds } from './attachment-kind.js';

/**
 * A file attached to a prompt for the agent.
 */
export interface AgentAttachment {
  /**
   * The file name.
   */
  name: string;
  /**
   * The file type, for example `image/jpeg`. It starts with `image/`, `text/`,
   * `audio/` or `video/`.
   */
  type: string;
  /**
   * The content of the file, base64-encoded.
   */
  data: string;
}

/**
 * Zod schema for `AgentAttachment`.
 */
export const agentAttachmentSchema = z.object({
  name: z.string().min(1).meta({ description: 'The file name' }),
  type: z
    .string()
    .refine((type) => AttachmentKinds.isSupported(type), {
      message: 'The file type must start with image/, text/, audio/ or video/',
    })
    .meta({
      description:
        'The file type, for example image/jpeg. It starts with image/, text/, audio/ or video/',
    }),
  data: z
    .base64()
    .meta({ description: 'The content of the file, base64-encoded' }),
}) satisfies z.ZodType<AgentAttachment>;
