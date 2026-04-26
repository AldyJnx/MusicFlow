import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from "@nestjs/swagger";
import { PlaylistsService } from "./playlists.service";
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackToPlaylistDto,
  ReorderTracksDto,
} from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";

@ApiTags("library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("library/playlists")
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: "Get all playlists" })
  async findAll(@CurrentUser("id") userId: string) {
    return this.playlistsService.findAll(userId);
  }

  @Get("shared/:shareToken")
  @Public()
  @ApiOperation({ summary: "Get public playlist by share token" })
  async findByShareToken(@Param("shareToken") shareToken: string) {
    return this.playlistsService.findByShareToken(shareToken);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get playlist by ID" })
  async findById(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.playlistsService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new playlist" })
  @ApiResponse({ status: 201, description: "Playlist created successfully" })
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 200, description: "Playlist updated successfully" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  async update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 204, description: "Playlist deleted successfully" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  async remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    await this.playlistsService.remove(id, userId);
  }

  @Post(":id/tracks")
  @ApiOperation({ summary: "Add track to playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 200, description: "Track added successfully" })
  @ApiResponse({ status: 404, description: "Playlist or track not found" })
  async addTrack(
    @CurrentUser("id") userId: string,
    @Param("id") playlistId: string,
    @Body() dto: AddTrackToPlaylistDto,
  ) {
    return this.playlistsService.addTrack(playlistId, userId, dto.trackId);
  }

  @Delete(":id/tracks/:trackId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove track from playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiParam({ name: "trackId", description: "Track ID" })
  @ApiResponse({ status: 204, description: "Track removed successfully" })
  @ApiResponse({ status: 404, description: "Playlist or track not found" })
  async removeTrack(
    @CurrentUser("id") userId: string,
    @Param("id") playlistId: string,
    @Param("trackId") trackId: string,
  ) {
    await this.playlistsService.removeTrack(playlistId, userId, trackId);
  }

  @Patch(":id/tracks/reorder")
  @ApiOperation({ summary: "Reorder tracks in playlist" })
  @ApiParam({ name: "id", description: "Playlist ID" })
  @ApiResponse({ status: 200, description: "Tracks reordered successfully" })
  @ApiResponse({ status: 404, description: "Playlist not found" })
  async reorderTracks(
    @CurrentUser("id") userId: string,
    @Param("id") playlistId: string,
    @Body() dto: ReorderTracksDto,
  ) {
    return this.playlistsService.reorderTracks(
      playlistId,
      userId,
      dto.trackIds,
    );
  }
}
