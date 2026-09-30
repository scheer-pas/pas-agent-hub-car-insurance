import { AgentModule } from '@pas/agent-api';
import { PasServiceNestjsModule } from '@pas/service-nestjs-api';
import { CarInsuranceAgent } from './car-insurance.agent';

/**
 * Car insurance: answers a text prompt with attached files.
 */
@PasServiceNestjsModule({})
@AgentModule({
  agents: [CarInsuranceAgent],
})
export class CarInsuranceModule {}
