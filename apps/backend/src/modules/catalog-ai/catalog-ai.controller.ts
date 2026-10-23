import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CatalogAiTask } from "@prisma/client";
import { CatalogAiService } from "./catalog-ai.service";
import {
  ListCatalogAiFindingsDto,
  ListCatalogAiRunsDto,
  AskCatalogAiDto,
  RunCatalogAiTaskDto,
} from "./dto";
import { CATALOG_AI_TASKS, taskDefinition } from "./catalog-ai.tasks";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

/**
 * Admin-only surface for the NVIDIA NIM catalog assistant.
 *
 * This controller is intentionally not mounted under the end-user `/ai`
 * prefix: the Claude player assistant and its monthly quota stay untouched,
 * and only an authenticated ADMIN can reach these routes.
 */
@ApiTags("admin/catalog-ai")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/catalog-ai")
export class CatalogAiController {
  constructor(private readonly catalogAiService: CatalogAiService) {}

  @Get("status")
  @ApiOperation({
    summary: "Deterministic catalog report and AI availability",
  })
  @ApiResponse({ status: 200, description: "Report retrieved" })
  async getStatus() {
    return this.catalogAiService.report();
  }

  @Get("tasks")
  @ApiOperation({ summary: "Available catalog quality tasks" })
  @ApiResponse({ status: 200, description: "Task list retrieved" })
  listTasks() {
    return CATALOG_AI_TASKS.map((task) => {
      const definition = taskDefinition(task);
      return {
        task,
        label: definition.label,
        description: definition.description,
        entityType: definition.entityType,
      };
    });
  }

  @Post("assistant")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Answer a read-only admin catalog question with NVIDIA NIM",
  })
  @ApiResponse({ status: 200, description: "Scoped assistant response" })
  @ApiResponse({ status: 403, description: "Requires the ADMIN role" })
  askAssistant(
    @CurrentUser("id") actorId: string,
    @Body() dto: AskCatalogAiDto,
  ) {
    return this.catalogAiService.answerAdminQuestion(dto.question, actorId);
  }

  @Post("runs/:task")
  @ApiOperation({
    summary: "Run a catalog quality task and store its proposals",
  })
  @ApiParam({ name: "task", enum: CATALOG_AI_TASKS })
  @ApiResponse({ status: 201, description: "Run stored with its findings" })
  @ApiResponse({
    status: 400,
    description: "NVIDIA_API_KEY missing or task payload invalid",
  })
  @ApiResponse({ status: 403, description: "Requires the ADMIN role" })
  runTask(
    @CurrentUser("id") actorId: string,
    @Param("task") task: CatalogAiTask,
    @Body() dto: RunCatalogAiTaskDto,
  ) {
    return this.catalogAiService.runTask(task, actorId, { limit: dto.limit });
  }

  @Get("runs")
  @ApiOperation({ summary: "List previous runs" })
  listRuns(@Query() dto: ListCatalogAiRunsDto) {
    return this.catalogAiService.listRuns({ skip: dto.skip, take: dto.take });
  }

  @Get("findings")
  @ApiOperation({
    summary: "List findings, optionally filtered by run or status",
  })
  listFindings(@Query() dto: ListCatalogAiFindingsDto) {
    return this.catalogAiService.listFindings({
      runId: dto.runId,
      status: dto.status,
    });
  }

  @Post("findings/:id/apply")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Apply a proposal through CatalogService",
  })
  @ApiParam({ name: "id", description: "Finding ID" })
  @ApiResponse({ status: 200, description: "Finding applied" })
  @ApiResponse({ status: 400, description: "Finding is not applicable" })
  @ApiResponse({ status: 404, description: "Finding not found" })
  applyFinding(@CurrentUser("id") actorId: string, @Param("id") id: string) {
    return this.catalogAiService.applyFinding(id, actorId);
  }

  @Post("findings/:id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Discard a proposal" })
  @ApiParam({ name: "id", description: "Finding ID" })
  @ApiResponse({ status: 200, description: "Finding rejected" })
  @ApiResponse({ status: 404, description: "Finding not found" })
  rejectFinding(@Param("id") id: string) {
    return this.catalogAiService.rejectFinding(id);
  }
}
