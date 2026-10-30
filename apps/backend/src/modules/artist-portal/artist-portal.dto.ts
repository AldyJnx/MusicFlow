import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from "class-validator";

export class MarkArtistNotificationsReadDto {
  /** When omitted, all current notifications for the artist are read. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  notificationIds?: string[];
}

export class CreateArtistPortalAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsInt()
  @Max(new Date().getFullYear())
  year?: number;
}

export class UpdateArtistPortalAlbumDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Max(new Date().getFullYear())
  year?: number;
}

export class CreateArtistAccessRequestDto {
  @IsUUID()
  artistId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evidence?: string;

  /** JSON encoded array when sent as multipart/form-data. */
  @IsOptional()
  @IsString()
  evidenceLinks?: string;
}

export class ReviewArtistAccessRequestDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ReviewArtistVerificationRequestDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class LinkArtistMembershipDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  artistId!: string;

  @IsIn(["OWNER", "MANAGER", "EDITOR", "ANALYST"])
  role!: "OWNER" | "MANAGER" | "EDITOR" | "ANALYST";
}

export class UpdateArtistPortalProfileDto {
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
  @IsString()
  @MaxLength(2000)
  imageUrl?: string;
}

/** Editable song fields exposed to the artist who owns the portal. */
export class UpdateArtistPortalTrackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  /** Existing public WAV/FLAC stored in R2. It is linked, never copied. */
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  fileUrlRemote?: string;

  @IsOptional()
  @IsUUID()
  albumId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  lyricsLrc?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  lyricsUrl?: string;

  @IsOptional()
  @IsBoolean()
  clearLyrics?: boolean;
}
