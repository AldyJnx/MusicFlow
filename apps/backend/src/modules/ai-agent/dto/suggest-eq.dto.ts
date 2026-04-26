import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SuggestEQDto {
  @ApiProperty({
    description: "Natural language prompt for EQ suggestion",
    example: "I want more bass for electronic music",
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;

  @ApiPropertyOptional({ description: "Track ID for context" })
  @IsOptional()
  @IsUUID()
  trackId?: string;

  @ApiPropertyOptional({ description: "Playlist ID for context" })
  @IsOptional()
  @IsUUID()
  playlistId?: string;

  @ApiPropertyOptional({ description: "Additional context data" })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
