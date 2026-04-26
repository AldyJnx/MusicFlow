import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EQScopeType, ReverbPreset } from "@prisma/client";

export class UpsertConfigDto {
  @ApiProperty({
    enum: EQScopeType,
    description: "Scope type for the EQ config",
  })
  @IsEnum(EQScopeType)
  scopeType: EQScopeType;

  @ApiPropertyOptional({
    description: "Scope ID (playlist/track ID, null for GLOBAL)",
  })
  @ValidateIf((o) => o.scopeType !== EQScopeType.GLOBAL)
  @IsString()
  @IsOptional()
  scopeId?: string;

  @ApiPropertyOptional({
    description: "Preset ID to use (mutually exclusive with custom bands)",
  })
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

  @ApiPropertyOptional({
    description: "Whether config is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
