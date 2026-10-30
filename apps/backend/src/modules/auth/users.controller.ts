import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { StorageService } from "@/modules/storage/storage.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { CompleteOnboardingDto } from "./dto/complete-onboarding.dto";
import { RecordActivityDto } from "./dto/record-activity.dto";
import { MarkNotificationsReadDto } from "./dto/mark-notifications-read.dto";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Post("me/onboarding")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete artist onboarding, including skip" })
  completeOnboarding(
    @CurrentUser("id") userId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto.artistIds);
  }

  @Get("me/followed-artists")
  @ApiOperation({ summary: "List artists followed by the current user" })
  followedArtists(@CurrentUser("id") userId: string) {
    return this.usersService.listFollowedArtists(userId);
  }

  @Get("me/notifications")
  @ApiOperation({
    summary: "List notifications for releases from followed artists",
  })
  notifications(
    @CurrentUser("id") userId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    return this.usersService.listNotifications(userId, {
      page,
      pageSize,
      sort,
      q,
    });
  }

  @Post("me/notifications/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark current user notifications as read" })
  markNotificationsRead(
    @CurrentUser("id") userId: string,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    return this.usersService.markNotificationsRead(userId, dto.notificationIds);
  }

  @Post("me/activity")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Report foreground activity and notification consent",
  })
  recordActivity(
    @CurrentUser("id") userId: string,
    @Body() dto: RecordActivityDto,
  ) {
    return this.usersService.recordActivity(userId, dto);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 409, description: "Username already taken" })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("avatar", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: "Upload user avatar" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
          description: "Avatar image file (JPEG, PNG, GIF, WebP - max 5MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Avatar uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async uploadAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Get current user to check for existing avatar
    const currentUser = await this.usersService.findById(user.id);

    // Delete old avatar if exists
    if (currentUser.avatar) {
      const oldKey = this.storageService.extractKeyFromUrl(currentUser.avatar);
      if (oldKey) {
        await this.storageService.deleteFile(oldKey).catch(() => {
          // Ignore errors when deleting old avatar
        });
      }
    }

    // Upload new avatar
    const result = await this.storageService.uploadFile(file, "avatars");

    // Update user with new avatar URL
    return this.usersService.update(user.id, { avatar: result.url });
  }

  @Delete("me/avatar")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete user avatar" })
  @ApiResponse({ status: 204, description: "Avatar deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteAvatar(@CurrentUser() user: { id: string }) {
    const currentUser = await this.usersService.findById(user.id);

    if (currentUser.avatar) {
      const key = this.storageService.extractKeyFromUrl(currentUser.avatar);
      if (key) {
        await this.storageService.deleteFile(key).catch(() => {
          // Ignore errors when deleting avatar
        });
      }
      await this.usersService.update(user.id, { avatar: "" });
    }
  }

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Permanently delete current user account" })
  @ApiResponse({ status: 204, description: "Account deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteAccount(@CurrentUser() user: { id: string }) {
    await this.usersService.deleteAccount(user.id);
  }
}
