import { Module } from '@nestjs/common';
import { EqualizerController } from './equalizer.controller';
import { PresetsService } from './presets.service';
import { ConfigsService } from './configs.service';
import { SegmentsService } from './segments.service';

@Module({
  controllers: [EqualizerController],
  providers: [PresetsService, ConfigsService, SegmentsService],
  exports: [PresetsService, ConfigsService, SegmentsService],
})
export class EqualizerModule {}
