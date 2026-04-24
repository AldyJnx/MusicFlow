import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EQScopeType, Prisma } from '@prisma/client';

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByScope(userId: string, scopeType: EQScopeType, scopeId?: string) {
    const config = await this.prisma.eQConfig.findFirst({
      where: {
        userId,
        scopeType,
        scopeId: scopeId ?? null,
      },
      include: { preset: true },
    });

    return config;
  }

  async resolveForTrack(userId: string, trackId: string, playlistId?: string) {
    // Priority: segment > track > playlist > global
    const configs = await this.prisma.eQConfig.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { scopeType: 'GLOBAL', scopeId: null },
          { scopeType: 'PLAYLIST', scopeId: playlistId },
          { scopeType: 'TRACK', scopeId: trackId },
        ],
      },
      include: { preset: true },
      orderBy: { scopeType: 'asc' },
    });

    // Return the most specific config
    const trackConfig = configs.find(c => c.scopeType === 'TRACK');
    if (trackConfig) return trackConfig;

    const playlistConfig = configs.find(c => c.scopeType === 'PLAYLIST');
    if (playlistConfig) return playlistConfig;

    return configs.find(c => c.scopeType === 'GLOBAL') || null;
  }

  async upsert(userId: string, data: {
    scopeType: EQScopeType;
    scopeId?: string;
    presetId?: string;
    bands?: number[];
    bassBoost?: number;
    virtualizer?: number;
    loudness?: number;
    reverbPreset?: string;
    reverbAmount?: number;
  }) {
    const existing = await this.prisma.eQConfig.findFirst({
      where: {
        userId,
        scopeType: data.scopeType,
        scopeId: data.scopeId ?? null,
      },
    });

    const configData = {
      presetId: data.presetId,
      bands: data.bands ?? [],
      bassBoost: data.bassBoost ?? 0,
      virtualizer: data.virtualizer ?? 0,
      loudness: data.loudness ?? 0,
      reverbPreset: (data.reverbPreset as any) ?? 'NONE',
      reverbAmount: data.reverbAmount ?? 0,
    };

    if (existing) {
      return this.prisma.eQConfig.update({
        where: { id: existing.id },
        data: configData,
        include: { preset: true },
      });
    }

    return this.prisma.eQConfig.create({
      data: {
        userId,
        scopeType: data.scopeType,
        scopeId: data.scopeId,
        ...configData,
      },
      include: { preset: true },
    });
  }

  async remove(id: string, userId: string) {
    const config = await this.prisma.eQConfig.findFirst({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException('Config not found');
    }

    return this.prisma.eQConfig.delete({ where: { id } });
  }

  async setActive(id: string, userId: string, isActive: boolean) {
    const config = await this.prisma.eQConfig.findFirst({
      where: { id, userId },
    });

    if (!config) {
      throw new NotFoundException('Config not found');
    }

    return this.prisma.eQConfig.update({
      where: { id },
      data: { isActive },
    });
  }
}
