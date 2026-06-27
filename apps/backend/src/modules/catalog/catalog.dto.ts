import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateArtistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;
}

export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;
}

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  artistId!: string;

  @IsOptional()
  @IsUrl()
  coverArt?: string;

  @IsOptional()
  @IsInt()
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
  @IsUrl()
  coverArt?: string;

  @IsOptional()
  @IsInt()
  year?: number;
}

/** Assign a track to an artist/album and optionally edit its cover. */
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
  @IsUrl()
  coverArt?: string;
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
}
