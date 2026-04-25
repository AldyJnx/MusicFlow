import { PartialType, OmitType } from "@nestjs/swagger";
import { CreateTrackDto } from "./create-track.dto";

export class UpdateTrackDto extends PartialType(
  OmitType(CreateTrackDto, ["fileHash"] as const),
) {}
