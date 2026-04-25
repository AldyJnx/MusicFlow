import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PlayDevice, StatsPeriod } from '@prisma/client';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('play')
  @ApiOperation({ summary: 'Record a play event' })
  async recordPlay(
    @CurrentUser('id') userId: string,
    @Body() data: {
      trackId: string;
      durationListenedMs: number;
      completed: boolean;
      skipped: boolean;
      device: PlayDevice;
      eqConfigUsedId?: string;
    },
  ) {
    return this.analyticsService.recordPlay(userId, data);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get play history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'trackId', required: false })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('trackId') trackId?: string,
  ) {
    return this.analyticsService.getPlayHistory(userId, { skip, take, trackId });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get listening stats' })
  @ApiQuery({ name: 'period', enum: StatsPeriod })
  async getStats(
    @CurrentUser('id') userId: string,
    @Query('period') period: StatsPeriod = 'WEEK',
  ) {
    return this.analyticsService.getStats(userId, period);
  }

  @Get('recently-played')
  @ApiOperation({ summary: 'Get recently played tracks' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentlyPlayed(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getRecentlyPlayed(userId, limit);
  }

  @Get('most-played')
  @ApiOperation({ summary: 'Get most played tracks' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMostPlayed(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getMostPlayed(userId, limit);
  }
}
