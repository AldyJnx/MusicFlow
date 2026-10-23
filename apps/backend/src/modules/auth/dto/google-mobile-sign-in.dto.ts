import { IsString, Length } from "class-validator";

export class GoogleMobileSignInDto {
  @IsString()
  @Length(20, 4096)
  idToken!: string;
}
