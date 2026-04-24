import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PresetsService } from './presets.service';
import { ConfigsService } from './configs.service';
import { SegmentsService } from './segments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { EQScopeType } from '@prisma/client';

@ApiTags('equalizer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equalizer')
export class EqualizerController {
  constructor(
    private readonly presetsService: PresetsService,
    private readonly configsService: ConfigsService,
    private readonly segmentsService: SegmentsService,
  ) {}

  // ============ PRESETS ============

  @Get('presets')
  @ApiOperation({ summary: 'Get all EQ presets (global + user)' })
  async getPresets(@CurrentUser('id') userId: string) {
    return this.presetsService.findAll(userId);
  }

  @Get('presets/:id')
  @ApiOperation({ summary: 'Get preset by ID' })
  async getPreset(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.presetsService.findById(id, userId);
  }

  @Post('presets')
  @ApiOperation({ summary: 'Create a custom preset' })
  async createPreset(
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.presetsService.create(userId, data);
  }

  @Patch('presets/:id')
  @ApiOperation({ summary: 'Update a custom preset' })
  async updatePreset(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.presetsService.update(id, userId, data);
  }

  @Delete('presets/:id')
  @ApiOperation({ summary: 'Delete a custom preset' })
  async deletePreset(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.presetsService.remove(id, userId);
  }

  // ============ CONFIGS ============

  @Get('configs')
  @ApiOperation({ summary: 'Get EQ config for a scope' })
  async getConfig(
    @CurrentUser('id') userId: string,
    @Query('scopeType') scopeType: EQScopeType,
    @Query('scopeId') scopeId?: string,
  ) {
    return this.configsService.findByScope(userId, scopeType, scopeId);
  }

  @Get('configs/resolve/:trackId')
  @ApiOperation({ summary: 'Resolve effective EQ config for a track' })
  async resolveConfig(
    @CurrentUser('id') userId: string,
    @Param('trackId') trackId: string,
    @Query('playlistId') playlistId?: string,
  ) {
    return this.configsService.resolveForTrack(userId, trackId, playlistId);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Create or update EQ config' })
  async upsertConfig(
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.configsService.upsert(userId, data);
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete EQ config' })
  async deleteConfig(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.configsService.remove(id, userId);
  }

  // ============ SEGMENTS ============

  @Get('segments/:trackId')
  @ApiOperation({ summary: 'Get all EQ segments for a track' })
  async getSegments(
    @CurrentUser('id') userId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.segmentsService.findByTrack(trackId, userId);
  }

  @Get('segments/:trackId/active')
  @ApiOperation({ summary: 'Get active segment at position' })
  async getActiveSegment(
    @CurrentUser('id') userId: string,
    @Param('trackId') trackId: string,
    @Query('position') position: number,
  ) {
    return this.segmentsService.findActiveAt(trackId, userId, position);
  }

  @Post('segments')
  @ApiOperation({ summary: 'Create a new EQ segment' })
  async createSegment(
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.segmentsService.create(userId, data);
  }

  @Patch('segments/:id')
  @ApiOperation({ summary: 'Update an EQ segment' })
  async updateSegment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.segmentsService.update(id, userId, data);
  }

  @Delete('segments/:id')
  @ApiOperation({ summary: 'Delete an EQ segment' })
  async deleteSegment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.segmentsService.remove(id, userId);
  }
}
