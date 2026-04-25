import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  async get(@CurrentUser('id') userId: string) {
    return this.preferencesService.get(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences' })
  async update(
    @CurrentUser('id') userId: string,
    @Body() data: any,
  ) {
    return this.preferencesService.update(userId, data);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset preferences to defaults' })
  async reset(@CurrentUser('id') userId: string) {
    return this.preferencesService.reset(userId);
  }
}
