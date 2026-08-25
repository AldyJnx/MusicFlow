import { IsString, Length } from "class-validator";

export class ExchangeGoogleTicketDto {
  @IsString()
  @Length(32, 256)
  ticket!: string;
}
