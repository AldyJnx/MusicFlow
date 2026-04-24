import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
      return this.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async update(userId: string, data: Prisma.UserPreferencesUpdateInput) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...data } as any,
      update: data,
    });
  }

  async reset(userId: string) {
    return this.prisma.userPreferences.update({
      where: { userId },
      data: {
        theme: 'dark_default',
        dynamicThemeEnabled: false,
        dynamicThemeIntensity: 50,
        playerLayout: 'STANDARD',
        libraryLayout: 'LIST',
        showAlbumArt: true,
        showVisualizer: false,
        visualizerType: 'bars',
        crossfadeEnabled: false,
        crossfadeDurationMs: 3000,
        gaplessEnabled: true,
        replayGain: false,
        skipSilence: false,
        sleepTimerDefaultMin: null,
        sleepTimerFadeOut: true,
        lastfmUsername: '',
        lastfmSessionKey: '',
        scrobbleEnabled: false,
        scrobbleThreshold: 50,
        lyricsFontSize: 16,
        lyricsAutoScroll: true,
      },
    });
  }
}
