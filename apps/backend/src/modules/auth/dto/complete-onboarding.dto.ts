import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsUUID } from "class-validator";

export class CompleteOnboardingDto {
  @ApiProperty({
    type: [String],
    maxItems: 5,
    description:
      "Up to five catalog artist IDs. An empty array skips selection.",
  })
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID("4", { each: true })
  artistIds!: string[];
}
