import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
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
import { AdminService } from "./admin.service";
import { UpdateUserRoleDto, UpdateUserPremiumDto } from "./dto";
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
