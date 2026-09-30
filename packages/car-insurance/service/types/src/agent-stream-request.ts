import { z } from 'zod';
import type { AgentAttachment } from './agent-attachment.js';
import { agentAttachmentSchema } from './agent-attachment.js';

/** Largest number of attachments one prompt can carry. */
export const MAX_AGENT_ATTACHMENTS = 10;

/**
 * Request payload for the streaming agent endpoint: a text prompt with
 * optional attachments.
 */
export interface AgentStreamRequest {
  /**
   * The text prompt.
   */
  text: string;
  /**
   * The attached files, 0 to 10. Missing means no attachments.
   */
  attachments?: AgentAttachment[];
}

/**
 * Zod schema for `AgentStreamRequest`.
 */
export const agentStreamRequestSchema = z.object({
  text: z.string().min(1).meta({ description: 'The text prompt' }),
  attachments: z
    .array(agentAttachmentSchema)
    .max(MAX_AGENT_ATTACHMENTS)
    .optional()
    .meta({ description: 'The attached files, 0 to 10' }),
}) satisfies z.ZodType<AgentStreamRequest>;
