import { z } from 'zod';

/**
 * Response payload from the agent endpoint.
 */
export type AgentResponse = string;

/**
 * Zod schema for `AgentResponse`.
 */
export const agentResponseSchema = z.string().meta({
  description: 'The text produced by the agent',
}) satisfies z.ZodType<AgentResponse>;
