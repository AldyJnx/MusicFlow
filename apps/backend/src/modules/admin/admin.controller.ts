import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import {
  CreateGlobalEqPresetDto,
  UpdateGlobalEqPresetDto,
  UpdateUserPremiumDto,
  UpdateUserRoleDto,
} from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get dashboard statistics" })
  @ApiResponse({ status: 200, description: "Dashboard stats retrieved" })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get("dashboard/growth")
  @ApiOperation({ summary: "Daily new-user counts over the last N days" })
  @ApiQuery({ name: "days", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Growth series retrieved" })
  async getDashboardGrowth(@Query("days") days?: number) {
    return this.adminService.getUserGrowth(days ? Number(days) : undefined);
  }

  @Get("dashboard/catalog")
  @ApiOperation({ summary: "Catalog distribution (genre, codec, totals)" })
  @ApiResponse({ status: 200, description: "Catalog distribution retrieved" })
  async getDashboardCatalog() {
    return this.adminService.getCatalogDistribution();
  }

  @Get("dashboard/active-users")
  @ApiOperation({
    summary: "Active users in the last 24h, 7d and 30d (DAU/WAU/MAU)",
  })
  @ApiResponse({ status: 200, description: "Active user counts retrieved" })
  async getDashboardActiveUsers() {
    return this.adminService.getActiveUsers();
  }

  @Get("users")
  @ApiOperation({ summary: "Get all users" })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiQuery({ name: "search", required: false })
  @ApiResponse({ status: 200, description: "Users list retrieved" })
  async getUsers(
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
  ) {
    return this.adminService.getUsers({ skip, take, search });
  }

  @Get("users/:id/detail")
  @ApiOperation({ summary: "Full user detail (devices, plays, AI usage)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User detail retrieved" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserDetail(@Param("id") userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Patch("users/:id/role")
  @ApiOperation({ summary: "Update user role" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User role updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserRole(
    @Param("id") userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Patch("users/:id/premium")
  @ApiOperation({ summary: "Update user premium status" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "Premium status updated" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserPremium(
    @Param("id") userId: string,
    @Body() dto: UpdateUserPremiumDto,
  ) {
    return this.adminService.updateUserPremium(userId, dto.isPremium);
  }

  @Post("users/:id/deactivate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate user" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User deactivated" })
  @ApiResponse({ status: 404, description: "User not found" })
  async deactivateUser(@Param("id") userId: string) {
    return this.adminService.deactivateUser(userId);
  }

  @Get("eq-presets")
  @ApiOperation({ summary: "List all global EQ presets" })
  @ApiResponse({ status: 200, description: "Global presets retrieved" })
  async listGlobalPresets() {
    return this.adminService.listGlobalPresets();
  }

  @Post("eq-presets")
  @ApiOperation({ summary: "Create a global EQ preset" })
  @ApiResponse({ status: 201, description: "Global preset created" })
  async createGlobalPreset(@Body() dto: CreateGlobalEqPresetDto) {
    return this.adminService.createGlobalPreset(dto);
  }

  @Patch("eq-presets/:id")
  @ApiOperation({ summary: "Update a global EQ preset" })
  @ApiParam({ name: "id", description: "Preset ID" })
  @ApiResponse({ status: 200, description: "Global preset updated" })
  @ApiResponse({ status: 404, description: "Preset not found" })
  async updateGlobalPreset(
    @Param("id") id: string,
    @Body() dto: UpdateGlobalEqPresetDto,
  ) {
    return this.adminService.updateGlobalPreset(id, dto);
  }

  @Delete("eq-presets/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a global EQ preset" })
  @ApiParam({ name: "id", description: "Preset ID" })
  @ApiResponse({ status: 204, description: "Global preset deleted" })
  @ApiResponse({ status: 404, description: "Preset not found" })
  async deleteGlobalPreset(@Param("id") id: string) {
    await this.adminService.deleteGlobalPreset(id);
  }

  @Get("ai/costs")
  @ApiOperation({
    summary: "AI usage + cost breakdown (totals, daily, by model, by user)",
  })
  @ApiQuery({ name: "days", required: false, type: Number })
  @ApiResponse({ status: 200, description: "AI cost report retrieved" })
  async getAiCosts(@Query("days") days?: number) {
    return this.adminService.getAiCosts(days ? Number(days) : undefined);
  }

  @Get("ai/feedback")
  @ApiOperation({ summary: "Get AI feedback statistics" })
  @ApiResponse({ status: 200, description: "AI feedback stats retrieved" })
  async getAiFeedbackStats() {
    return this.adminService.getAiFeedbackStats();
  }

  @Get("ai/requests")
  @ApiOperation({ summary: "Get recent AI requests" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Recent AI requests retrieved" })
  async getRecentAiRequests(@Query("limit") limit?: number) {
    return this.adminService.getRecentAiRequests(limit);
  }
}
