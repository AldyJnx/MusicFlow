import {
  Controller,
  Get,
  Patch,
  Post,
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
} from "@nestjs/swagger";
import { PreferencesService } from "./preferences.service";
import { UpdatePreferencesDto } from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("preferences")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("preferences")
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: "Get user preferences" })
  @ApiResponse({ status: 200, description: "Preferences retrieved" })
  async get(@CurrentUser("id") userId: string) {
    return this.preferencesService.get(userId);
  }

  @Patch()
  @ApiOperation({ summary: "Update user preferences" })
  @ApiResponse({ status: 200, description: "Preferences updated" })
  async update(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.update(userId, dto);
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset preferences to defaults" })
  @ApiResponse({ status: 200, description: "Preferences reset to defaults" })
  async reset(@CurrentUser("id") userId: string) {
    return this.preferencesService.reset(userId);
  }
}
