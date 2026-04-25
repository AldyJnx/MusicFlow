import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.eQPreset.findMany({
      where: {
        OR: [{ userId }, { isGlobal: true }],
      },
      orderBy: [{ isGlobal: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, userId: string) {
    const preset = await this.prisma.eQPreset.findFirst({
      where: {
        id,
        OR: [{ userId }, { isGlobal: true }],
      },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    return preset;
  }

  async create(userId: string, data: {
    name: string;
    bands: number[];
    bassBoost?: number;
    virtualizer?: number;
    loudness?: number;
    reverbPreset?: string;
    reverbAmount?: number;
  }) {
    return this.prisma.eQPreset.create({
      data: {
        userId,
        name: data.name,
        bands: data.bands,
        bassBoost: data.bassBoost ?? 0,
        virtualizer: data.virtualizer ?? 0,
        loudness: data.loudness ?? 0,
        reverbPreset: (data.reverbPreset as any) ?? 'NONE',
        reverbAmount: data.reverbAmount ?? 0,
      },
    });
  }

  async update(id: string, userId: string, data: Prisma.EQPresetUpdateInput) {
    const preset = await this.prisma.eQPreset.findFirst({
      where: { id, userId, isGlobal: false },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found or is global');
    }

    return this.prisma.eQPreset.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const preset = await this.prisma.eQPreset.findFirst({
      where: { id, userId, isGlobal: false },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found or is global');
    }

    return this.prisma.eQPreset.delete({ where: { id } });
  }

  async seedGlobalPresets() {
    const globalPresets = [
      { name: 'Flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      { name: 'Bass Boost', bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
      { name: 'Treble Boost', bands: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6] },
      { name: 'Rock', bands: [5, 4, 2, 0, -1, 0, 2, 4, 5, 5] },
      { name: 'Pop', bands: [0, 2, 4, 5, 4, 2, 0, -1, -1, 0] },
      { name: 'Jazz', bands: [3, 2, 0, 2, -2, -2, 0, 2, 3, 4] },
      { name: 'Classical', bands: [4, 3, 2, 1, 0, 0, 0, 2, 3, 4] },
      { name: 'Electronic', bands: [5, 4, 2, 0, -2, 2, 0, 2, 4, 5] },
      { name: 'Hip-Hop', bands: [6, 5, 3, 0, -1, 0, 2, 0, 2, 3] },
      { name: 'Vocal', bands: [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2] },
    ];

    for (const preset of globalPresets) {
      await this.prisma.eQPreset.upsert({
        where: { id: `global-${preset.name.toLowerCase().replace(/\s+/g, '-')}` },
        create: {
          id: `global-${preset.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: preset.name,
          bands: preset.bands,
          isGlobal: true,
        },
        update: {
          name: preset.name,
          bands: preset.bands,
        },
      });
    }
  }
}
