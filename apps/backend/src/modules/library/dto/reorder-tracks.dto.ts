import { IsArray, IsUUID, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ReorderTracksDto {
  @ApiProperty({
    description: "Array of track IDs in the new order",
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  trackIds: string[];
}
