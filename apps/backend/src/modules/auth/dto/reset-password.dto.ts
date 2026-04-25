import { IsNotEmpty, IsString, MinLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({
    example: "abc123token",
    description: "Password reset token received via email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: "NewSecure@Pass123",
    description:
      "New password (min 8 chars, must include uppercase, lowercase, number)",
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  password: string;
}
