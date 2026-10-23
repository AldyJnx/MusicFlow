import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { CatalogAiFindingStatus } from "@prisma/client";

export class RunCatalogAiTaskDto {
  @ApiPropertyOptional({
    description:
      "Máximo de ítems a enviar al modelo en esta corrida. Se acota a 200 para no exceder el límite del endpoint.",
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ListCatalogAiRunsDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}

export class ListCatalogAiFindingsDto {
  @ApiPropertyOptional({ description: "Filtra los hallazgos de una corrida" })
  @IsOptional()
  @IsUUID()
  runId?: string;

  @ApiPropertyOptional({ enum: CatalogAiFindingStatus })
  @IsOptional()
  @IsEnum(CatalogAiFindingStatus)
  status?: CatalogAiFindingStatus;
}

/** A deliberately small, read-only prompt for the admin catalog assistant. */
export class AskCatalogAiDto {
  @ApiPropertyOptional({
    description:
      "Pregunta sobre el uso o la calidad del catálogo de MusicFlow. No ejecuta cambios.",
    maxLength: 600,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(600)
  question!: string;
}
