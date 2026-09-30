import { CarInsuranceAgent } from './car-insurance.agent';

/** The options the `@Agent` decorator stores on the agent class. */
interface AgentOptions {
  systemPrompt: string;
  dynamicPrompts: Array<() => unknown>;
}

describe('CarInsuranceAgent', () => {
  const options = CarInsuranceAgent as unknown as AgentOptions;

  it('has one system prompt that asks to use the attached files', () => {
    expect(options.systemPrompt).toContain(
      'When files are attached to the prompt, use their content to answer.',
    );
  });

  it('passes the current date and time as text, not as a second system message', () => {
    const prompts = options.dynamicPrompts.map((prompt) => prompt());

    expect(prompts).toHaveLength(1);
    expect(typeof prompts[0]).toBe('string');
    expect(prompts[0]).toMatch(/^The current date and time is /);
  });
});
