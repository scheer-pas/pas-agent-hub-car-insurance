import { AgentModule } from '@pas/agent-api';
import { PasServiceNestjsModule } from '@pas/service-nestjs-api';
import { CarInsuranceAgent } from './car-insurance.agent';
import { CarInsuranceAgentStream } from './car-insurance-agent-stream';
import { CarInsuranceAttachments } from './car-insurance-attachments';
import { CarInsuranceController } from './car-insurance.controller';

/**
 * Car insurance: answers a text prompt with attached files.
 */
@PasServiceNestjsModule({
  controllers: [CarInsuranceController],
  providers: [CarInsuranceAgentStream, CarInsuranceAttachments],
})
@AgentModule({
  agents: [CarInsuranceAgent],
})
export class CarInsuranceModule {}
