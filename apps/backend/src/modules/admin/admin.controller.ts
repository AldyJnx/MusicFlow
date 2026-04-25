import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers({ skip, take, search });
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() data: { role: 'ADMIN' | 'CLIENT' },
  ) {
    return this.adminService.updateUserRole(userId, data.role);
  }

  @Patch('users/:id/premium')
  @ApiOperation({ summary: 'Update user premium status' })
  async updateUserPremium(
    @Param('id') userId: string,
    @Body() data: { isPremium: boolean },
  ) {
    return this.adminService.updateUserPremium(userId, data.isPremium);
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivateUser(@Param('id') userId: string) {
    return this.adminService.deactivateUser(userId);
  }

  @Get('ai/feedback')
  @ApiOperation({ summary: 'Get AI feedback statistics' })
  async getAiFeedbackStats() {
    return this.adminService.getAiFeedbackStats();
  }

  @Get('ai/requests')
  @ApiOperation({ summary: 'Get recent AI requests' })
  async getRecentAiRequests(@Query('limit') limit?: number) {
    return this.adminService.getRecentAiRequests(limit);
  }
}
