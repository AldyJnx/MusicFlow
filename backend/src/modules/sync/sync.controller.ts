import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ConflictResolution } from '@prisma/client';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  @ApiOperation({ summary: 'Pull changes from server' })
  @ApiHeader({ name: 'X-Device-ID', required: true })
  async pull(
    @CurrentUser('id') userId: string,
    @Headers('x-device-id') deviceId: string,
    @Query('since') since?: string,
  ) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.syncService.pull(userId, deviceId, sinceDate);
  }

  @Post('push')
  @ApiOperation({ summary: 'Push changes to server' })
  @ApiHeader({ name: 'X-Device-ID', required: true })
  async push(
    @CurrentUser('id') userId: string,
    @Headers('x-device-id') deviceId: string,
    @Body() delta: any,
  ) {
    return this.syncService.push(userId, deviceId, delta);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Get unresolved conflicts' })
  async getConflicts(@CurrentUser('id') userId: string) {
    return this.syncService.getConflicts(userId);
  }

  @Post('conflicts/:id/resolve')
  @ApiOperation({ summary: 'Resolve a sync conflict' })
  async resolveConflict(
    @CurrentUser('id') userId: string,
    @Param('id') conflictId: string,
    @Body() data: { resolution: ConflictResolution },
  ) {
    return this.syncService.resolveConflict(conflictId, userId, data.resolution);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get sync history' })
  async getSyncLogs(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.syncService.getSyncLogs(userId, limit);
  }
}
