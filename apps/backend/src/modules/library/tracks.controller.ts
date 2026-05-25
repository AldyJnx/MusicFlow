import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { TracksService } from "./tracks.service";
import { CreateTrackDto, UpdateTrackDto } from "./dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@ApiTags("library")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("library/tracks")
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  @ApiOperation({ summary: "Get all tracks" })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "artist", required: false })
  @ApiQuery({ name: "album", required: false })
  @ApiQuery({ name: "genre", required: false })
  async findAll(
    @CurrentUser("id") userId: string,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
    @Query("search") search?: string,
    @Query("artist") artist?: string,
    @Query("album") album?: string,
    @Query("genre") genre?: string,
  ) {
    return this.tracksService.findAll(userId, {
      skip,
      take,
      search,
      artist,
      album,
      genre,
    });
  }

  @Get("artists")
  @ApiOperation({ summary: "Get all artists" })
  async getArtists(@CurrentUser("id") userId: string) {
    return this.tracksService.getArtists(userId);
  }

  @Get("albums")
  @ApiOperation({ summary: "Get all albums" })
  @ApiQuery({ name: "artist", required: false })
  async getAlbums(
    @CurrentUser("id") userId: string,
    @Query("artist") artist?: string,
  ) {
    return this.tracksService.getAlbums(userId, artist);
  }

  @Get("genres")
  @ApiOperation({ summary: "Get all genres" })
  async getGenres(@CurrentUser("id") userId: string) {
    return this.tracksService.getGenres(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get track by ID" })
  async findById(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.tracksService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new track" })
  @ApiResponse({ status: 201, description: "Track created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 409,
    description: "Track with this hash already exists",
  })
  async create(@CurrentUser("id") userId: string, @Body() dto: CreateTrackDto) {
    return this.tracksService.create(userId, dto);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({
    summary:
      "Upload an audio file (multipart). Server extracts metadata and dedupes by SHA-256.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        title: { type: "string" },
        artist: { type: "string" },
        album: { type: "string" },
      },
      required: ["file"],
    },
  })
  @ApiResponse({ status: 201, description: "Track uploaded" })
  @ApiResponse({ status: 409, description: "Track already exists" })
  async upload(
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("title") title?: string,
    @Body("artist") artist?: string,
    @Body("album") album?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Missing file");
    }
    return this.tracksService.uploadFromFile(userId, file, {
      title,
      artist,
      album,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a track" })
  @ApiResponse({ status: 200, description: "Track updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateTrackDto,
  ) {
    return this.tracksService.update(id, userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a track" })
  @ApiResponse({ status: 204, description: "Track deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Track not found" })
  async remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    await this.tracksService.remove(id, userId);
  }
}
