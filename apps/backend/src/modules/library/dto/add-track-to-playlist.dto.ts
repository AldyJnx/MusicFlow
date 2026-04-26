import { IsUUID, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddTrackToPlaylistDto {
  @ApiProperty({ description: "Track ID to add to playlist" })
  @IsUUID()
  @IsNotEmpty()
  trackId: string;
}
