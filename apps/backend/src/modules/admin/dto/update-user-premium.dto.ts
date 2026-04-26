import { IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserPremiumDto {
  @ApiProperty({ description: "Premium status" })
  @IsBoolean()
  isPremium: boolean;
}
