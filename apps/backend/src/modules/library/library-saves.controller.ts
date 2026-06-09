import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsString } from "class-validator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { LibrarySavesService } from "./library-saves.service";

class CheckSavedDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  trackIds!: string[];
}

@ApiTags("library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("library/saves")
export class LibrarySavesController {
  constructor(private readonly savesService: LibrarySavesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List the user\'s "Liked Songs" — own uploads UNION explicit catalog saves.',
  })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiQuery({ name: "search", required: false })
  async list(
    @CurrentUser("id") userId: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
  ) {
    return this.savesService.listSavedTracks(userId, { skip, take, search });
  }

  @Get("latest-cover")
  @ApiOperation({
    summary:
      'Cover art of the most recently liked track, for the "Me gustan" card.',
  })
  async latestCover(
    @CurrentUser("id") userId: string,
  ): Promise<{ coverArt: string | null; trackId: string | null }> {
    return this.savesService.getLatestSavedCover(userId);
  }

  @Post("check")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Return which of the given trackIds the user has saved (or owns).",
  })
  @ApiBody({ type: CheckSavedDto })
  async check(
    @CurrentUser("id") userId: string,
    @Body() dto: CheckSavedDto,
  ): Promise<{ savedTrackIds: string[] }> {
    const ids = await this.savesService.getSavedTrackIds(userId, dto.trackIds);
    return { savedTrackIds: ids };
  }

  @Post(":trackId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save a track to "Liked Songs" (idempotent).' })
  @ApiResponse({ status: 200, description: "Saved or already saved" })
  @ApiResponse({ status: 404, description: "Track not visible to the user" })
  async save(
    @CurrentUser("id") userId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.savesService.save(userId, trackId);
  }

  @Delete(":trackId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a saved track." })
  @ApiResponse({ status: 204, description: "Removed (or was not saved)" })
  @ApiResponse({
    status: 409,
    description: "Cannot unsave a track you own",
  })
  async unsave(
    @CurrentUser("id") userId: string,
    @Param("trackId") trackId: string,
  ): Promise<void> {
    await this.savesService.unsave(userId, trackId);
  }
}
