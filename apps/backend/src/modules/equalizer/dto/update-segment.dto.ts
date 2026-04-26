import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { SegmentEQConfigDto } from "./create-segment.dto";

export class UpdateSegmentDto {
  @ApiPropertyOptional({ description: "Segment label", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({ description: "Start position in milliseconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startMs?: number;

  @ApiPropertyOptional({ description: "End position in milliseconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  endMs?: number;

  @ApiPropertyOptional({ description: "Transition duration in ms" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  transitionMs?: number;

  @ApiPropertyOptional({ description: "EQ configuration updates" })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SegmentEQConfigDto)
  eqConfig?: SegmentEQConfigDto;
}
