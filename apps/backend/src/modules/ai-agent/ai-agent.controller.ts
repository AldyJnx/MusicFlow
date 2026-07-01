import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AiAgentService } from "./ai-agent.service";
import {
  SuggestEQDto,
  AssistDto,
  AcceptSuggestionDto,
  ProvideFeedbackDto,
  DetectSegmentsDto,
} from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import {
  CurrentUser,
  AuthUser,
} from "@/common/decorators/current-user.decorator";
import { QuotaService } from "@/modules/billing/quota.service";

@ApiTags("ai-agent")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiAgentController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly quotaService: QuotaService,
  ) {}

  @Post("suggest")
  // Anti-burst on top of the monthly quota: 5 requests / 60s per IP. Stops
  // a user from blowing through their 10/mo allowance in a single second
  // (and stops attackers from holding the Claude SDK hostage).
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Get AI EQ suggestion" })
  @ApiResponse({ status: 201, description: "EQ suggestion generated" })
  @ApiResponse({
    status: 403,
    description: "Monthly AI request quota exceeded",
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests — slow down",
  })
  async suggestEQ(@CurrentUser() user: AuthUser, @Body() dto: SuggestEQDto) {
    await this.quotaService.assertAiQuota(user);
    return this.aiAgentService.suggestEQ(user.id, dto);
  }

  @Post("assistant")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "Flexible assistant: tune sound or recommend music personalized to taste",
  })
  @ApiResponse({ status: 201, description: "Assistant replied" })
  @ApiResponse({
    status: 403,
    description: "Monthly AI request quota exceeded",
  })
  @ApiResponse({ status: 429, description: "Too many requests — slow down" })
  async assist(@CurrentUser() user: AuthUser, @Body() dto: AssistDto) {
    await this.quotaService.assertAiQuota(user);
    return this.aiAgentService.assist(user.id, dto);
  }

  @Post("detect-segments")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Auto-detect EQ segments for a track with AI" })
  @ApiResponse({ status: 201, description: "Segments detected and created" })
  @ApiResponse({
    status: 400,
    description: "Track already has segments",
  })
  @ApiResponse({
    status: 403,
    description: "Monthly AI request quota exceeded",
  })
  @ApiResponse({ status: 404, description: "Track not found" })
  async detectSegments(
    @CurrentUser() user: AuthUser,
    @Body() dto: DetectSegmentsDto,
  ) {
    await this.quotaService.assertAiQuota(user);
    return this.aiAgentService.detectSegments(user.id, dto.trackId);
  }

  @Post(":requestId/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept AI suggestion" })
  @ApiParam({ name: "requestId", description: "AI Request ID" })
  @ApiResponse({ status: 200, description: "Suggestion accepted" })
  @ApiResponse({ status: 404, description: "Request not found" })
  async acceptSuggestion(
    @CurrentUser("id") userId: string,
    @Param("requestId") requestId: string,
    @Body() dto: AcceptSuggestionDto,
  ) {
    return this.aiAgentService.acceptSuggestion(
      requestId,
      userId,
      dto.appliedTo,
      dto.appliedId,
    );
  }

  @Post(":requestId/feedback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Provide feedback on AI suggestion" })
  @ApiParam({ name: "requestId", description: "AI Request ID" })
  @ApiResponse({ status: 200, description: "Feedback recorded" })
  @ApiResponse({ status: 404, description: "Request not found" })
  async provideFeedback(
    @CurrentUser("id") userId: string,
    @Param("requestId") requestId: string,
    @Body() dto: ProvideFeedbackDto,
  ) {
    return this.aiAgentService.provideFeedback(
      requestId,
      userId,
      dto.feedback,
      dto.comment,
    );
  }

  @Get("history")
  @ApiOperation({ summary: "Get AI suggestion history" })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiResponse({ status: 200, description: "History retrieved" })
  async getHistory(
    @CurrentUser("id") userId: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ) {
    return this.aiAgentService.getHistory(userId, { skip, take });
  }
}
