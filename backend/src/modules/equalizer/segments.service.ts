import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EQSegmentCreatedBy } from '@prisma/client';

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTrack(trackId: string, userId: string) {
    return this.prisma.eQSegment.findMany({
      where: { trackId, userId },
      include: { eqConfig: { include: { preset: true } } },
      orderBy: { startMs: 'asc' },
    });
  }

  async findActiveAt(trackId: string, userId: string, positionMs: number) {
    return this.prisma.eQSegment.findFirst({
      where: {
        trackId,
        userId,
        startMs: { lte: positionMs },
        endMs: { gt: positionMs },
      },
      include: { eqConfig: { include: { preset: true } } },
    });
  }

  async create(userId: string, data: {
    trackId: string;
    label?: string;
    startMs: number;
    endMs: number;
    transitionMs?: number;
    createdBy?: EQSegmentCreatedBy;
    aiRequestId?: string;
    eqConfig: {
      presetId?: string;
      bands?: number[];
      bassBoost?: number;
      virtualizer?: number;
      loudness?: number;
      reverbPreset?: string;
      reverbAmount?: number;
    };
  }) {
    // Validate time range
    if (data.startMs >= data.endMs) {
      throw new BadRequestException('startMs must be less than endMs');
    }

    // Get track to validate duration
    const track = await this.prisma.track.findFirst({
      where: { id: data.trackId, userId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (data.endMs > track.durationMs) {
      throw new BadRequestException('endMs exceeds track duration');
    }

    // Check for overlapping segments
    const overlapping = await this.prisma.eQSegment.findFirst({
      where: {
        trackId: data.trackId,
        userId,
        OR: [
          { startMs: { lt: data.endMs }, endMs: { gt: data.startMs } },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Segment overlaps with existing segment');
    }

    // Create EQ config and segment in transaction
    return this.prisma.$transaction(async (tx) => {
      const eqConfig = await tx.eQConfig.create({
        data: {
          userId,
          scopeType: 'SEGMENT',
          presetId: data.eqConfig.presetId,
          bands: data.eqConfig.bands ?? [],
          bassBoost: data.eqConfig.bassBoost ?? 0,
          virtualizer: data.eqConfig.virtualizer ?? 0,
          loudness: data.eqConfig.loudness ?? 0,
          reverbPreset: (data.eqConfig.reverbPreset as any) ?? 'NONE',
          reverbAmount: data.eqConfig.reverbAmount ?? 0,
        },
      });

      return tx.eQSegment.create({
        data: {
          trackId: data.trackId,
          userId,
          eqConfigId: eqConfig.id,
          label: data.label ?? '',
          startMs: data.startMs,
          endMs: data.endMs,
          transitionMs: data.transitionMs ?? 500,
          createdBy: data.createdBy ?? 'MANUAL',
          aiRequestId: data.aiRequestId,
        },
        include: { eqConfig: { include: { preset: true } } },
      });
    });
  }

  async update(id: string, userId: string, data: {
    label?: string;
    startMs?: number;
    endMs?: number;
    transitionMs?: number;
    eqConfig?: {
      presetId?: string;
      bands?: number[];
      bassBoost?: number;
      virtualizer?: number;
      loudness?: number;
      reverbPreset?: string;
      reverbAmount?: number;
    };
  }) {
    const segment = await this.prisma.eQSegment.findFirst({
      where: { id, userId },
      include: { track: true },
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    const newStartMs = data.startMs ?? segment.startMs;
    const newEndMs = data.endMs ?? segment.endMs;

    if (newStartMs >= newEndMs) {
      throw new BadRequestException('startMs must be less than endMs');
    }

    if (newEndMs > segment.track.durationMs) {
      throw new BadRequestException('endMs exceeds track duration');
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.eqConfig) {
        await tx.eQConfig.update({
          where: { id: segment.eqConfigId },
          data: {
            presetId: data.eqConfig.presetId,
            bands: data.eqConfig.bands,
            bassBoost: data.eqConfig.bassBoost,
            virtualizer: data.eqConfig.virtualizer,
            loudness: data.eqConfig.loudness,
            reverbPreset: data.eqConfig.reverbPreset as any,
            reverbAmount: data.eqConfig.reverbAmount,
          },
        });
      }

      return tx.eQSegment.update({
        where: { id },
        data: {
          label: data.label,
          startMs: data.startMs,
          endMs: data.endMs,
          transitionMs: data.transitionMs,
        },
        include: { eqConfig: { include: { preset: true } } },
      });
    });
  }

  async remove(id: string, userId: string) {
    const segment = await this.prisma.eQSegment.findFirst({
      where: { id, userId },
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    // Delete both segment and its config
    return this.prisma.$transaction([
      this.prisma.eQSegment.delete({ where: { id } }),
      this.prisma.eQConfig.delete({ where: { id: segment.eqConfigId } }),
    ]);
  }
}
