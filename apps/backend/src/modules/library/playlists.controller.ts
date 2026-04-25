import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library/playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all playlists' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.playlistsService.findAll(userId);
  }

  @Get('shared/:shareToken')
  @Public()
  @ApiOperation({ summary: 'Get public playlist by share token' })
  async findByShareToken(@Param('shareToken') shareToken: string) {
    return this.playlistsService.findByShareToken(shareToken);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID' })
  async findById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.playlistsService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new playlist' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { name: string; description?: string },
  ) {
    return this.playlistsService.create(userId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a playlist' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string; coverArt?: string; isPublic?: boolean },
  ) {
    return this.playlistsService.update(id, userId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a playlist' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.playlistsService.remove(id, userId);
  }

  @Post(':id/tracks')
  @ApiOperation({ summary: 'Add track to playlist' })
  async addTrack(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Body() data: { trackId: string },
  ) {
    return this.playlistsService.addTrack(playlistId, userId, data.trackId);
  }

  @Delete(':id/tracks/:trackId')
  @ApiOperation({ summary: 'Remove track from playlist' })
  async removeTrack(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(playlistId, userId, trackId);
  }

  @Patch(':id/tracks/reorder')
  @ApiOperation({ summary: 'Reorder tracks in playlist' })
  async reorderTracks(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Body() data: { trackIds: string[] },
  ) {
    return this.playlistsService.reorderTracks(playlistId, userId, data.trackIds);
  }
}
