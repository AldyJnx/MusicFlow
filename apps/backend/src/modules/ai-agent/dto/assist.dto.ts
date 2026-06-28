import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssistDto {
  @ApiProperty({
    description:
      "Free-form request for the assistant (sound tuning or music recommendations)",
    example: "Ponme algo para el gym",
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;

  @ApiPropertyOptional({
    description: "Currently playing track id, for context",
  })
  @IsOptional()
  @IsUUID()
  trackId?: string;
}
