import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class MarkNotificationsReadDto {
  /** When omitted, every currently available notification is marked as read. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  notificationIds?: string[];
}
