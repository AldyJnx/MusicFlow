import {
  IsArray,
  IsInt,
  Max,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateArtistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  genres?: string[];
}

export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  genres?: string[];
}

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  artistId!: string;

  @IsOptional()
  @IsInt()
  @Max(new Date().getFullYear())
  year?: number;
}

export class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  artistId?: string;

  @IsOptional()
  @IsInt()
  @Max(new Date().getFullYear())
  year?: number;
}

export class FeaturedArtistCreditDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  artistName!: string;

  @IsOptional()
  @IsString()
  artistId?: string | null;
}

export class ArtistImageUrlDto {
  @IsUrl({ protocols: ["https"], require_protocol: true })
  imageUrl!: string;
}

/** Assign a track to an artist/album and update its collaboration credits. */
export class AssignTrackDto {
  @IsOptional()
  @IsString()
  artistId?: string | null;

  @IsOptional()
  @IsString()
  albumId?: string | null;

  @IsOptional()
  @IsInt()
  albumOrder?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeaturedArtistCreditDto)
  featuredArtists?: FeaturedArtistCreditDto[];
}

/** Ordered list of track ids that make up an album. */
export class ReorderAlbumDto {
  @IsArray()
  @IsString({ each: true })
  trackIds!: string[];
}

/** Admin lyrics upload. `.lrc` (synced) and/or plain text. */
export class UpdateLyricsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  lyricsLrc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  lyricsText?: string;

  /** Public HTTPS URL to an LRC object stored in Cloudflare R2. */
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  lyricsUrl?: string;
}

/** Edits that belong to a song itself, independently from its album. */
export class UpdateCatalogTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  /** Existing public WAV/FLAC object in Cloudflare R2; it is linked, not copied. */
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  fileUrlRemote?: string;
}
