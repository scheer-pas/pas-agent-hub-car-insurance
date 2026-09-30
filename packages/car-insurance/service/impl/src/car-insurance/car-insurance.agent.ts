import { Agent, DefaultAgent, MultimodalInput } from '@pas/agent-api';

/**
 * The text part of a prompt for the Car Insurance agent. Attached files travel
 * as attachments beside it.
 */
export interface CarInsurancePrompt extends Record<string, unknown> {
  /** The text prompt. */
  text: string;
}

@Agent({
  configKey: 'agents.carInsurance',
  agentName: 'car-insurance',
  systemPrompt: [
    'You are a helpful AI assistant.',
    'When files are attached to the prompt, use their content to answer.',
  ].join('\n'),
  userPrompt: '{{input.text}}',
  dynamicPrompts: [
    // Returned as text, the date is passed as a message before the prompt.
    // Gemini accepts only one system message, so it cannot be a second one.
    () => `The current date and time is ${new Date().toLocaleString()}`,
  ],
})
export class CarInsuranceAgent extends DefaultAgent<
  MultimodalInput<CarInsurancePrompt>
> {}
