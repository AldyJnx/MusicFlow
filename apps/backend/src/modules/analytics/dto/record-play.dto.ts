import {
  IsUUID,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PlayDevice } from "@prisma/client";

export class RecordPlayDto {
  @ApiProperty({ description: "Track ID" })
  @IsUUID()
  trackId: string;

  @ApiProperty({ description: "Duration listened in milliseconds" })
  @IsNumber()
  @Min(0)
  durationListenedMs: number;

  @ApiProperty({ description: "Whether track was completed" })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({ description: "Whether track was skipped" })
  @IsBoolean()
  skipped: boolean;

  @ApiProperty({ enum: PlayDevice, description: "Device type" })
  @IsEnum(PlayDevice)
  device: PlayDevice;

  @ApiPropertyOptional({ description: "EQ config ID used during playback" })
  @IsOptional()
  @IsUUID()
  eqConfigUsedId?: string;
}
