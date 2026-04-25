import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TrackSource, SyncStatus } from "@prisma/client";

export class CreateTrackDto {
  @ApiProperty({ description: "Track title", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: "Artist name", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  artist: string;

  @ApiPropertyOptional({ description: "Album name", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  album?: string;

  @ApiPropertyOptional({ description: "Album artist", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  albumArtist?: string;

  @ApiPropertyOptional({ description: "Genre", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional({ description: "Release year" })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  year?: number;

  @ApiPropertyOptional({ description: "Track number in album" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  trackNumber?: number;

  @ApiPropertyOptional({ description: "Disc number" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  discNumber?: number;

  @ApiPropertyOptional({ description: "Composer", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  composer?: string;

  @ApiPropertyOptional({ description: "Comment", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiProperty({ description: "Duration in milliseconds" })
  @IsNumber()
  @Min(0)
  durationMs: number;

  @ApiPropertyOptional({ description: "Local file path" })
  @IsOptional()
  @IsString()
  filePathLocal?: string;

  @ApiPropertyOptional({ description: "Remote file URL" })
  @IsOptional()
  @IsString()
  fileUrlRemote?: string;

  @ApiProperty({ description: "File hash for deduplication" })
  @IsString()
  @IsNotEmpty()
  fileHash: string;

  @ApiPropertyOptional({ description: "File size in bytes" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ description: "Audio codec", default: "" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codec?: string;

  @ApiPropertyOptional({ description: "Bitrate in kbps" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bitrate?: number;

  @ApiPropertyOptional({ description: "Sample rate in Hz" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sampleRate?: number;

  @ApiPropertyOptional({ description: "Cover art URL" })
  @IsOptional()
  @IsString()
  coverArt?: string;

  @ApiPropertyOptional({ enum: TrackSource, default: TrackSource.LOCAL })
  @IsOptional()
  @IsEnum(TrackSource)
  source?: TrackSource;

  @ApiPropertyOptional({ enum: SyncStatus, default: SyncStatus.PENDING })
  @IsOptional()
  @IsEnum(SyncStatus)
  syncStatus?: SyncStatus;
}
