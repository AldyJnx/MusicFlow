import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AIFeedback } from "@prisma/client";

export class ProvideFeedbackDto {
  @ApiProperty({ enum: AIFeedback, description: "Feedback rating" })
  @IsEnum(AIFeedback)
  feedback: AIFeedback;

  @ApiPropertyOptional({
    description: "Optional feedback comment",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
