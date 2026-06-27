import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CatalogService } from "./catalog.service";
import {
  AssignTrackDto,
  CreateAlbumDto,
  CreateArtistDto,
  ReorderAlbumDto,
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateLyricsDto,
} from "./catalog.dto";

@ApiTags("admin-catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/catalog")
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}

  // Artists
  @Post("artists")
  createArtist(@Body() dto: CreateArtistDto) {
    return this.catalog.createArtist(dto);
  }

  @Patch("artists/:id")
  updateArtist(@Param("id") id: string, @Body() dto: UpdateArtistDto) {
    return this.catalog.updateArtist(id, dto);
  }

  @Delete("artists/:id")
  deleteArtist(@Param("id") id: string) {
    return this.catalog.deleteArtist(id);
  }

  // Albums
  @Post("albums")
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.catalog.createAlbum(dto);
  }

  @Patch("albums/:id")
  updateAlbum(@Param("id") id: string, @Body() dto: UpdateAlbumDto) {
    return this.catalog.updateAlbum(id, dto);
  }

  @Delete("albums/:id")
  deleteAlbum(@Param("id") id: string) {
    return this.catalog.deleteAlbum(id);
  }

  @Patch("albums/:id/tracks")
  reorderAlbum(@Param("id") id: string, @Body() dto: ReorderAlbumDto) {
    return this.catalog.reorderAlbum(id, dto);
  }

  // Tracks
  @Get("tracks/unassigned")
  unassigned(@Query("artistId") artistId?: string) {
    return this.catalog.unassignedTracks(artistId);
  }

  @Patch("tracks/:id")
  assignTrack(@Param("id") id: string, @Body() dto: AssignTrackDto) {
    return this.catalog.assignTrack(id, dto);
  }

  @Patch("tracks/:id/lyrics")
  updateLyrics(@Param("id") id: string, @Body() dto: UpdateLyricsDto) {
    return this.catalog.updateLyrics(id, dto);
  }
}
