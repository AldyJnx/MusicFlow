import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import {
  CreateArtistAccessRequestDto,
  CreateArtistPortalAlbumDto,
  MarkArtistNotificationsReadDto,
  UpdateArtistPortalAlbumDto,
  UpdateArtistPortalProfileDto,
  UpdateArtistPortalTrackDto,
} from "./artist-portal.dto";
import { catalogAudioFileFilter } from "@/common/upload/audio-file-filter";
import { imageFileFilter } from "@/common/upload/image-file-filter";
import { ArtistPortalService } from "./artist-portal.service";

@UseGuards(JwtAuthGuard)
@Controller("artist-portal")
export class ArtistPortalController {
  constructor(private readonly portal: ArtistPortalService) {}

  @Get("me")
  getContext(@CurrentUser("id") userId: string) {
    return this.portal.getContext(userId);
  }

  @Get("available-artists")
  listArtists(@CurrentUser("id") userId: string, @Query("q") query?: string) {
    return this.portal.listAvailableArtists(userId, query);
  }

  @Post("access-requests")
  @UseInterceptors(
    FileInterceptor("document", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const isPdf =
          file.mimetype === "application/pdf" &&
          /\.pdf$/i.test(file.originalname);
        callback(
          isPdf
            ? null
            : new BadRequestException("La evidencia debe ser un PDF."),
          isPdf,
        );
      },
    }),
  )
  requestAccess(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateArtistAccessRequestDto,
    @UploadedFile() document?: Express.Multer.File,
  ) {
    return this.portal.requestAccess(userId, dto, document);
  }

  @Post("artists/:artistId/verification-requests")
  requestVerification(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
  ) {
    return this.portal.requestVerification(userId, artistId);
  }

  @Get("artists/:artistId/dashboard")
  dashboard(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
  ) {
    return this.portal.dashboard(userId, artistId);
  }

  @Get("artists/:artistId/music")
  music(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    return this.portal.music(userId, artistId, { page, pageSize, sort, q });
  }

  @Get("artists/:artistId/albums")
  albums(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    return this.portal.albums(userId, artistId, { page, pageSize, sort, q });
  }

  @Get("artists/:artistId/music/:trackId/lyrics")
  lyrics(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.portal.lyrics(userId, artistId, trackId);
  }

  @Post("artists/:artistId/music")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: catalogAudioFileFilter,
    }),
  )
  uploadMusic(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("title") title?: string,
    @Body("albumId") albumId?: string,
    @Body("lyricsUrl") lyricsUrl?: string,
    @Body("lyricsLrc") lyricsLrc?: string,
  ) {
    if (!file) throw new BadRequestException("Missing file");
    return this.portal.uploadMusic(userId, artistId, file, {
      title,
      albumId,
      lyricsUrl,
      lyricsLrc,
    });
  }

  @Post("artists/:artistId/albums")
  @UseInterceptors(
    FileInterceptor("cover", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  createAlbum(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Body() dto: CreateArtistPortalAlbumDto,
    @UploadedFile() cover: Express.Multer.File,
  ) {
    if (!cover) {
      throw new BadRequestException("Selecciona una portada WEBP o AVIF.");
    }
    return this.portal.createAlbum(userId, artistId, dto, cover);
  }

  @Patch("artists/:artistId/albums/:albumId")
  updateAlbum(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("albumId") albumId: string,
    @Body() dto: UpdateArtistPortalAlbumDto,
  ) {
    return this.portal.updateAlbum(userId, artistId, albumId, dto);
  }

  @Post("artists/:artistId/albums/:albumId/cover")
  @UseInterceptors(
    FileInterceptor("cover", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  updateAlbumCover(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("albumId") albumId: string,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    if (!cover) {
      throw new BadRequestException("Selecciona una portada WEBP o AVIF.");
    }
    return this.portal.updateAlbumCover(userId, artistId, albumId, cover);
  }

  @Delete("artists/:artistId/albums/:albumId")
  deleteAlbum(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("albumId") albumId: string,
  ) {
    return this.portal.deleteAlbum(userId, artistId, albumId);
  }

  @Patch("artists/:artistId/music/:trackId")
  updateMusic(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("trackId") trackId: string,
    @Body() dto: UpdateArtistPortalTrackDto,
  ) {
    return this.portal.updateMusic(userId, artistId, trackId, dto);
  }

  @Patch("artists/:artistId/music/:trackId/deactivate")
  deactivateMusic(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.portal.deactivateMusic(userId, artistId, trackId);
  }

  @Delete("artists/:artistId/music/:trackId")
  deleteMusic(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Param("trackId") trackId: string,
  ) {
    return this.portal.deleteMusic(userId, artistId, trackId);
  }

  @Get("artists/:artistId/music/export")
  @Header("Content-Type", "application/vnd.ms-excel; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=musicflow-musica.xls")
  async exportMusic(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    const tracks: Array<{ title: string; playsLast30Days: number }> =
      await this.portal.exportMusic(userId, artistId, { sort, q });
    const escape = (value: string | number) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const rows = tracks
      .map(
        (track) =>
          `<Row><Cell><Data ss:Type="String">${escape(track.title)}</Data></Cell><Cell><Data ss:Type="Number">${track.playsLast30Days}</Data></Cell></Row>`,
      )
      .join("");
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Música"><Table><Row><Cell><Data ss:Type="String">Canción</Data></Cell><Cell><Data ss:Type="String">Reproducciones (30 días)</Data></Cell></Row>${rows}</Table></Worksheet></Workbook>`;
    return new StreamableFile(Buffer.from(`\uFEFF${workbook}`, "utf8"));
  }

  @Get("artists/:artistId/analytics")
  analytics(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Query("days") days?: string,
  ) {
    return this.portal.analytics(userId, artistId, Number(days ?? 30));
  }

  @Get("artists/:artistId/notifications")
  notifications(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
  ) {
    return this.portal.notifications(userId, artistId);
  }

  @Post("artists/:artistId/notifications/read")
  markNotificationsRead(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Body() dto: MarkArtistNotificationsReadDto,
  ) {
    return this.portal.markNotificationsRead(
      userId,
      artistId,
      dto.notificationIds,
    );
  }

  @Get("artists/:artistId/team")
  team(@CurrentUser("id") userId: string, @Param("artistId") artistId: string) {
    return this.portal.team(userId, artistId);
  }

  @Patch("artists/:artistId/profile")
  updateProfile(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @Body() dto: UpdateArtistPortalProfileDto,
  ) {
    return this.portal.updateProfile(userId, artistId, dto);
  }

  @Patch("artists/:artistId/profile-image")
  @UseInterceptors(
    FileInterceptor("image", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  updateProfileImage(
    @CurrentUser("id") userId: string,
    @Param("artistId") artistId: string,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.portal.updateProfileImage(userId, artistId, image);
  }
}
