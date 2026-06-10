import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

export class DetectSegmentsDto {
  @ApiProperty({ description: "Track to analyze and split into EQ segments" })
  @IsUUID()
  @IsNotEmpty()
  trackId: string;
}
