import {
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PlayerLayout, LibraryLayout } from "@prisma/client";

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: "Theme name" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  theme?: string;

  @ApiPropertyOptional({
    description: "Enable dynamic theme based on album art",
  })
  @IsOptional()
  @IsBoolean()
  dynamicThemeEnabled?: boolean;

  @ApiPropertyOptional({ description: "Dynamic theme intensity (0-100)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  dynamicThemeIntensity?: number;

  @ApiPropertyOptional({ enum: PlayerLayout })
  @IsOptional()
  @IsEnum(PlayerLayout)
  playerLayout?: PlayerLayout;

  @ApiPropertyOptional({ enum: LibraryLayout })
  @IsOptional()
  @IsEnum(LibraryLayout)
  libraryLayout?: LibraryLayout;

  @ApiPropertyOptional({ description: "Show album art" })
  @IsOptional()
  @IsBoolean()
  showAlbumArt?: boolean;

  @ApiPropertyOptional({ description: "Show visualizer" })
  @IsOptional()
  @IsBoolean()
  showVisualizer?: boolean;

  @ApiPropertyOptional({ description: "Visualizer type" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  visualizerType?: string;

  @ApiPropertyOptional({ description: "Enable crossfade" })
  @IsOptional()
  @IsBoolean()
  crossfadeEnabled?: boolean;

  @ApiPropertyOptional({ description: "Crossfade duration in ms" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(12000)
  crossfadeDurationMs?: number;

  @ApiPropertyOptional({ description: "Enable gapless playback" })
  @IsOptional()
  @IsBoolean()
  gaplessEnabled?: boolean;

  @ApiPropertyOptional({ description: "Enable replay gain" })
  @IsOptional()
  @IsBoolean()
  replayGain?: boolean;

  @ApiPropertyOptional({ description: "Skip silence" })
  @IsOptional()
  @IsBoolean()
  skipSilence?: boolean;

  @ApiPropertyOptional({ description: "Default sleep timer in minutes" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(180)
  sleepTimerDefaultMin?: number;

  @ApiPropertyOptional({ description: "Fade out on sleep timer" })
  @IsOptional()
  @IsBoolean()
  sleepTimerFadeOut?: boolean;

  @ApiPropertyOptional({ description: "Last.fm username" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastfmUsername?: string;

  @ApiPropertyOptional({ description: "Enable scrobbling" })
  @IsOptional()
  @IsBoolean()
  scrobbleEnabled?: boolean;

  @ApiPropertyOptional({ description: "Scrobble threshold (percentage)" })
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(100)
  scrobbleThreshold?: number;

  @ApiPropertyOptional({ description: "Lyrics font size" })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(32)
  lyricsFontSize?: number;

  @ApiPropertyOptional({ description: "Auto scroll lyrics" })
  @IsOptional()
  @IsBoolean()
  lyricsAutoScroll?: boolean;
}
