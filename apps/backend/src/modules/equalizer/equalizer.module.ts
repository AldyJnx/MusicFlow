import { Module } from "@nestjs/common";
import { EqualizerController } from "./equalizer.controller";
import { PresetsService } from "./presets.service";
import { ConfigsService } from "./configs.service";
import { SegmentsService } from "./segments.service";
import { BillingModule } from "../billing/billing.module";
import { PremiumGuard } from "@/common/guards/premium.guard";

@Module({
  imports: [BillingModule],
  controllers: [EqualizerController],
  providers: [PresetsService, ConfigsService, SegmentsService, PremiumGuard],
  exports: [PresetsService, ConfigsService, SegmentsService],
})
export class EqualizerModule {}
