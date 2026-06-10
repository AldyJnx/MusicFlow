import { Module } from "@nestjs/common";
import { AiAgentController } from "./ai-agent.controller";
import { AiAgentService } from "./ai-agent.service";
import { BillingModule } from "../billing/billing.module";
import { EqualizerModule } from "../equalizer/equalizer.module";

@Module({
  imports: [BillingModule, EqualizerModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
