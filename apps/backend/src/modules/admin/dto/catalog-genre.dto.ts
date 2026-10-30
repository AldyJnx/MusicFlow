import { IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class CreateCatalogGenreDto {
  @ApiProperty({ example: "Salsa", minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}

export class UpdateCatalogGenreDto extends PartialType(CreateCatalogGenreDto) {}
