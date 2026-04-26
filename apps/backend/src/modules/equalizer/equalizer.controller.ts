import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { PresetsService } from "./presets.service";
import { ConfigsService } from "./configs.service";
import { SegmentsService } from "./segments.service";
import {
  CreatePresetDto,
  UpdatePresetDto,
  UpsertConfigDto,
  CreateSegmentDto,
  UpdateSegmentDto,
} from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { EQScopeType } from "@prisma/client";

@ApiTags("equalizer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("equalizer")
export class EqualizerController {
  constructor(
    private readonly presetsService: PresetsService,
    private readonly configsService: ConfigsService,
    private readonly segmentsService: SegmentsService,
  ) {}

  // ============ PRESETS ============

  @Get("presets")
  @ApiOperation({ summary: "Get all EQ presets (global + user)" })
  async getPresets(@CurrentUser("id") userId: string) {
    return this.presetsService.findAll(userId);
  }

  @Get("presets/:id")
  @ApiOperation({ summary: "Get preset by ID" })
  async getPreset(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.presetsService.findById(id, userId);
  }

  @Post("presets")
  @ApiOperation({ summary: "Create a custom preset" })
  @ApiResponse({ status: 201, description: "Preset created successfully" })
  async createPreset(
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePresetDto,
  ) {
    return this.presetsService.create(userId, dto);
  }

  @Patch("presets/:id")
  @ApiOperation({ summary: "Update a custom preset" })
  @ApiParam({ name: "id", description: "Preset ID" })
  @ApiResponse({ status: 200, description: "Preset updated successfully" })
  @ApiResponse({ status: 404, description: "Preset not found" })
  async updatePreset(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdatePresetDto,
  ) {
    return this.presetsService.update(id, userId, dto);
  }

  @Delete("presets/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a custom preset" })
  @ApiParam({ name: "id", description: "Preset ID" })
  @ApiResponse({ status: 204, description: "Preset deleted successfully" })
  @ApiResponse({ status: 404, description: "Preset not found" })
  async deletePreset(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    await this.presetsService.remove(id, userId);
  }

  // ============ CONFIGS ============

  @Get("configs")
  @ApiOperation({ summary: "Get EQ config for a scope" })
  async getConfig(
    @CurrentUser("id") userId: string,
    @Query("scopeType") scopeType: EQScopeType,
    @Query("scopeId") scopeId?: string,
  ) {
    return this.configsService.findByScope(userId, scopeType, scopeId);
  }

  @Get("configs/resolve/:trackId")
  @ApiOperation({ summary: "Resolve effective EQ config for a track" })
  async resolveConfig(
    @CurrentUser("id") userId: string,
    @Param("trackId") trackId: string,
    @Query("playlistId") playlistId?: string,
  ) {
    return this.configsService.resolveForTrack(userId, trackId, playlistId);
  }

  @Post("configs")
  @ApiOperation({ summary: "Create or update EQ config" })
  @ApiResponse({ status: 200, description: "Config upserted successfully" })
  async upsertConfig(
    @CurrentUser("id") userId: string,
    @Body() dto: UpsertConfigDto,
  ) {
    return this.configsService.upsert(userId, dto);
  }

  @Delete("configs/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete EQ config" })
  @ApiParam({ name: "id", description: "Config ID" })
  @ApiResponse({ status: 204, description: "Config deleted successfully" })
  @ApiResponse({ status: 404, description: "Config not found" })
  async deleteConfig(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    await this.configsService.remove(id, userId);
  }

  // ============ SEGMENTS ============

  @Get("segments/:trackId")
  @ApiOperation({ summary: "Get all EQ segments for a track" })
  async getSegments(
    @CurrentUser("id") userId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.segmentsService.findByTrack(trackId, userId);
  }

  @Get("segments/:trackId/active")
  @ApiOperation({ summary: "Get active segment at position" })
  async getActiveSegment(
    @CurrentUser("id") userId: string,
    @Param("trackId") trackId: string,
    @Query("position") position: number,
  ) {
    return this.segmentsService.findActiveAt(trackId, userId, position);
  }

  @Post("segments")
  @ApiOperation({ summary: "Create a new EQ segment" })
  @ApiResponse({ status: 201, description: "Segment created successfully" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async createSegment(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.segmentsService.create(userId, dto);
  }

  @Patch("segments/:id")
  @ApiOperation({ summary: "Update an EQ segment" })
  @ApiParam({ name: "id", description: "Segment ID" })
  @ApiResponse({ status: 200, description: "Segment updated successfully" })
  @ApiResponse({ status: 404, description: "Segment not found" })
  async updateSegment(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.segmentsService.update(id, userId, dto);
  }

  @Delete("segments/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an EQ segment" })
  @ApiParam({ name: "id", description: "Segment ID" })
  @ApiResponse({ status: 204, description: "Segment deleted successfully" })
  @ApiResponse({ status: 404, description: "Segment not found" })
  async deleteSegment(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ) {
    await this.segmentsService.remove(id, userId);
  }
}
