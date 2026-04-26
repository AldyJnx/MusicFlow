import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePlaylistDto {
  @ApiProperty({ description: "Playlist name", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: "Playlist description", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "Cover art URL" })
  @IsOptional()
  @IsString()
  coverArt?: string;

  @ApiPropertyOptional({ description: "Make playlist public", default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
