import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsObject,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReverbPreset, EQSegmentCreatedBy } from "@prisma/client";

export class SegmentEQConfigDto {
  @ApiPropertyOptional({ description: "Preset ID to use" })
  @IsOptional()
  @IsUUID()
  presetId?: string;

  @ApiPropertyOptional({
    description: "10-band EQ values (-15 to +15 dB)",
    example: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  bands?: number[];

  @ApiPropertyOptional({ description: "Bass boost (0-100)", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bassBoost?: number;

  @ApiPropertyOptional({ description: "Virtualizer (0-100)", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  virtualizer?: number;

  @ApiPropertyOptional({ description: "Loudness (0-100)", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  loudness?: number;

  @ApiPropertyOptional({ enum: ReverbPreset, default: ReverbPreset.NONE })
  @IsOptional()
  @IsEnum(ReverbPreset)
  reverbPreset?: ReverbPreset;

  @ApiPropertyOptional({ description: "Reverb amount (0-100)", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  reverbAmount?: number;
}

export class CreateSegmentDto {
  @ApiProperty({ description: "Track ID for this segment" })
  @IsUUID()
  @IsNotEmpty()
  trackId: string;

  @ApiPropertyOptional({
    description: 'Segment label (e.g., "Intro", "Chorus")',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiProperty({ description: "Start position in milliseconds" })
  @IsNumber()
  @Min(0)
  startMs: number;

  @ApiProperty({ description: "End position in milliseconds" })
  @IsNumber()
  @Min(0)
  endMs: number;

  @ApiPropertyOptional({
    description: "Transition duration in ms",
    default: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  transitionMs?: number;

  @ApiProperty({ description: "EQ configuration for this segment" })
  @IsObject()
  @ValidateNested()
  @Type(() => SegmentEQConfigDto)
  eqConfig: SegmentEQConfigDto;

  @ApiPropertyOptional({
    enum: EQSegmentCreatedBy,
    default: EQSegmentCreatedBy.MANUAL,
  })
  @IsOptional()
  @IsEnum(EQSegmentCreatedBy)
  createdBy?: EQSegmentCreatedBy;

  @ApiPropertyOptional({ description: "AI Request ID if created by AI" })
  @IsOptional()
  @IsUUID()
  aiRequestId?: string;
}
