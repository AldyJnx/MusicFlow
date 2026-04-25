import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AIAppliedTo, AIFeedback } from '@prisma/client';

@ApiTags('ai-agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('suggest')
  @ApiOperation({ summary: 'Get AI EQ suggestion' })
  async suggestEQ(
    @CurrentUser('id') userId: string,
    @Body() data: {
      prompt: string;
      trackId?: string;
      playlistId?: string;
      context?: Record<string, unknown>;
    },
  ) {
    return this.aiAgentService.suggestEQ(userId, data);
  }

  @Post(':requestId/accept')
  @ApiOperation({ summary: 'Accept AI suggestion' })
  async acceptSuggestion(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
    @Body() data: { appliedTo: AIAppliedTo; appliedId?: string },
  ) {
    return this.aiAgentService.acceptSuggestion(requestId, userId, data.appliedTo, data.appliedId);
  }

  @Post(':requestId/feedback')
  @ApiOperation({ summary: 'Provide feedback on AI suggestion' })
  async provideFeedback(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
    @Body() data: { feedback: AIFeedback; comment?: string },
  ) {
    return this.aiAgentService.provideFeedback(requestId, userId, data.feedback, data.comment);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get AI suggestion history' })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.aiAgentService.getHistory(userId, { skip, take });
  }
}
