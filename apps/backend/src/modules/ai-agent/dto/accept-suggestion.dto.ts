import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AIAppliedTo } from "@prisma/client";

export class AcceptSuggestionDto {
  @ApiProperty({
    enum: AIAppliedTo,
    description: "Where to apply the suggestion",
  })
  @IsEnum(AIAppliedTo)
  appliedTo: AIAppliedTo;

  @ApiPropertyOptional({
    description: "ID of the entity (playlist/track/segment)",
  })
  @IsOptional()
  @IsUUID()
  appliedId?: string;
}
