import {
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
import { ApiQuery, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@UseGuards(JwtAuthGuard)
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("artists")
  listArtists() {
    return this.catalog.listArtists();
  }

  @Get("artists/page")
  listArtistsPage(
    @Query("q") query?: string,
    @Query("offset") offset?: string,
    @Query("limit") limit?: string,
  ) {
    return this.catalog.listArtistsPage({
      query,
      offset: Number(offset ?? 0),
      limit: Number(limit ?? 6),
    });
  }

  @Get("genres")
  listGenres() {
    return this.catalog.getGenres();
  }

  @Get("albums/recent")
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  listRecentAlbums(@Query("limit") limit?: string) {
    return this.catalog.listRecentAlbums(Number(limit ?? 10));
  }

  @Get("trending")
  @ApiQuery({ name: "limit", required: false, type: Number, example: 5 })
  listTrendingTracks(@Query("limit") limit?: string) {
    return this.catalog.listTrendingTracks(Number(limit ?? 5));
  }

  @Get("artists/:id")
  getArtist(@Param("id") id: string) {
    return this.catalog.getArtist(id);
  }

  @Post("artists/:id/follow")
  @HttpCode(HttpStatus.OK)
  followArtist(
    @CurrentUser("id") userId: string,
    @Param("id") artistId: string,
  ) {
    return this.catalog.followArtist(userId, artistId);
  }

  @Delete("artists/:id/follow")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowArtist(
    @CurrentUser("id") userId: string,
    @Param("id") artistId: string,
  ): Promise<void> {
    await this.catalog.unfollowArtist(userId, artistId);
  }

  @Get("albums/:id")
  getAlbum(@Param("id") id: string) {
    return this.catalog.getAlbum(id);
  }
}
