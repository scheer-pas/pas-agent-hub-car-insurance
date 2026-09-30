import component from '../component.json';
import { CarInsuranceAgent } from './car-insurance/car-insurance.agent';

/** The options the `@Agent` decorator stores on an agent class. */
interface AgentOptions {
  configKey: string;
  agentName?: string;
}

describe('component.json', () => {
  const agents = [CarInsuranceAgent] as unknown as AgentOptions[];

  it.each(agents.map((agent) => [agent.configKey, agent]))(
    'names the agent of %s as its agent feature does',
    (configKey, agent) => {
      const feature = component.features.find(
        (candidate) => candidate.configKey === configKey,
      );

      expect(feature).toBeDefined();
      expect(agent.agentName).toBe(feature?.name);
    },
  );
});
