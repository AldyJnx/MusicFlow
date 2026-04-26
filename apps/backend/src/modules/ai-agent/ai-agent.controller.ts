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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AiAgentService } from "./ai-agent.service";
import { SuggestEQDto, AcceptSuggestionDto, ProvideFeedbackDto } from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("ai-agent")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post("suggest")
  @ApiOperation({ summary: "Get AI EQ suggestion" })
  @ApiResponse({ status: 201, description: "EQ suggestion generated" })
  async suggestEQ(
    @CurrentUser("id") userId: string,
    @Body() dto: SuggestEQDto,
  ) {
    return this.aiAgentService.suggestEQ(userId, dto);
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
