import { Module } from "@nestjs/common";
import { AiAgentController } from "./ai-agent.controller";
import { AiAgentService } from "./ai-agent.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
