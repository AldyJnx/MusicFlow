import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReverbPreset } from "@prisma/client";

export class CreatePresetDto {
  @ApiProperty({ description: "Preset name", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "10-band EQ values (-15 to +15 dB)",
    example: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  bands: number[];

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
