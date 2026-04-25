import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from "@nestjs/swagger";
import { DevicesService } from "./devices.service";
import { CreateDeviceDto } from "./dto/create-device.dto";
import { UpdateFcmTokenDto } from "./dto/update-fcm-token.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("devices")
@Controller("devices")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: "List all user devices" })
  @ApiResponse({ status: 200, description: "Devices retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@CurrentUser() user: { id: string }) {
    return this.devicesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Register a new device" })
  @ApiResponse({ status: 201, description: "Device registered successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.create(user.id, dto);
  }

  @Patch(":id/fcm-token")
  @ApiOperation({ summary: "Update device FCM token" })
  @ApiParam({ name: "id", description: "Device ID" })
  @ApiResponse({ status: 200, description: "FCM token updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Device not found" })
  async updateFcmToken(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateFcmTokenDto,
  ) {
    return this.devicesService.updateFcmToken(id, user.id, dto.fcmToken);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a device" })
  @ApiParam({ name: "id", description: "Device ID" })
  @ApiResponse({ status: 204, description: "Device removed successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Device not found" })
  async remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    await this.devicesService.remove(id, user.id);
  }
}
