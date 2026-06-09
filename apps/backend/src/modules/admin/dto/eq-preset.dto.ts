import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { ReverbPreset } from "@prisma/client";

export class CreateGlobalEqPresetDto {
  @ApiProperty({ example: "Bass Boost", maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({
    description: "10 band gains in dB, ordered low→high frequency",
    example: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(-15, { each: true })
  @Max(15, { each: true })
  bands!: number[];

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bassBoost?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  virtualizer?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  loudness?: number;

  @ApiPropertyOptional({ enum: ReverbPreset, default: "NONE" })
  @IsOptional()
  @IsEnum(ReverbPreset)
  reverbPreset?: ReverbPreset;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  reverbAmount?: number;
}

export class UpdateGlobalEqPresetDto extends PartialType(
  CreateGlobalEqPresetDto,
) {}
