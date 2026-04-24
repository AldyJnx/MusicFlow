import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictResolution } from '@prisma/client';

interface SyncDelta {
  tracks?: Array<{ id: string; data: any; deleted?: boolean }>;
  playlists?: Array<{ id: string; data: any; deleted?: boolean }>;
  eqConfigs?: Array<{ id: string; data: any; deleted?: boolean }>;
  eqSegments?: Array<{ id: string; data: any; deleted?: boolean }>;
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async pull(userId: string, deviceId: string, since?: Date) {
    const lastSync = since || new Date(0);

    // Start sync log
    const syncLog = await this.prisma.syncLog.create({
      data: { userId, deviceId },
    });

    try {
      // Get updated entities since last sync
      const [tracks, playlists, eqConfigs, eqSegments, preferences] = await Promise.all([
        this.prisma.track.findMany({
          where: { userId, updatedAt: { gt: lastSync } },
        }),
        this.prisma.playlist.findMany({
          where: { userId, updatedAt: { gt: lastSync } },
          include: { tracks: true },
        }),
        this.prisma.eQConfig.findMany({
          where: { userId, updatedAt: { gt: lastSync } },
        }),
        this.prisma.eQSegment.findMany({
          where: { userId, updatedAt: { gt: lastSync } },
        }),
        this.prisma.userPreferences.findUnique({
          where: { userId },
        }),
      ]);

      const entitiesDownloaded = tracks.length + playlists.length + eqConfigs.length + eqSegments.length;

      // Update sync log
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          entitiesDownloaded,
          success: true,
        },
      });

      // Update device last sync
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { lastSyncAt: new Date() },
      });

      return {
        syncId: syncLog.id,
        timestamp: new Date(),
        data: { tracks, playlists, eqConfigs, eqSegments, preferences },
      };
    } catch (error) {
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          success: false,
          errorMessage: (error as Error).message,
        },
      });
      throw error;
    }
  }

  async push(userId: string, deviceId: string, delta: SyncDelta) {
    const syncLog = await this.prisma.syncLog.create({
      data: { userId, deviceId },
    });

    let entitiesUploaded = 0;
    let conflictsDetected = 0;

    try {
      // Process tracks
      if (delta.tracks) {
        for (const item of delta.tracks) {
          if (item.deleted) {
            await this.prisma.track.deleteMany({
              where: { id: item.id, userId },
            });
          } else {
            const existing = await this.prisma.track.findFirst({
              where: { id: item.id, userId },
            });

            if (existing && existing.updatedAt > new Date(item.data.updatedAt)) {
              // Conflict detected
              await this.createConflict(userId, 'track', item.id, item.data, existing);
              conflictsDetected++;
            } else {
              await this.prisma.track.upsert({
                where: { id: item.id },
                create: { ...item.data, userId },
                update: item.data,
              });
              entitiesUploaded++;
            }
          }
        }
      }

      // Process playlists
      if (delta.playlists) {
        for (const item of delta.playlists) {
          if (item.deleted) {
            await this.prisma.playlist.deleteMany({
              where: { id: item.id, userId },
            });
          } else {
            await this.prisma.playlist.upsert({
              where: { id: item.id },
              create: { ...item.data, userId },
              update: item.data,
            });
            entitiesUploaded++;
          }
        }
      }

      // Process EQ configs and segments similarly...

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          entitiesUploaded,
          conflictsDetected,
          success: true,
        },
      });

      await this.prisma.device.update({
        where: { id: deviceId },
        data: { lastSyncAt: new Date() },
      });

      return {
        syncId: syncLog.id,
        entitiesUploaded,
        conflictsDetected,
        success: true,
      };
    } catch (error) {
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          success: false,
          errorMessage: (error as Error).message,
        },
      });
      throw error;
    }
  }

  async getConflicts(userId: string) {
    return this.prisma.conflictLog.findMany({
      where: { userId, resolved: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveConflict(conflictId: string, userId: string, resolution: ConflictResolution) {
    const conflict = await this.prisma.conflictLog.findFirst({
      where: { id: conflictId, userId },
    });

    if (!conflict) {
      throw new NotFoundException('Conflict not found');
    }

    // Apply resolution based on choice
    if (resolution === 'LOCAL_WINS') {
      // Update server with local version
      await this.applyConflictResolution(conflict.entityType, conflict.entityId, conflict.localVersion as any, userId);
    } else if (resolution === 'SERVER_WINS') {
      // Keep server version (no action needed)
    } else if (resolution === 'MERGE') {
      // TODO: Implement merge logic
    }

    return this.prisma.conflictLog.update({
      where: { id: conflictId },
      data: {
        resolved: true,
        resolution,
        resolvedAt: new Date(),
      },
    });
  }

  private async createConflict(userId: string, entityType: string, entityId: string, localVersion: any, serverVersion: any) {
    return this.prisma.conflictLog.create({
      data: {
        userId,
        entityType,
        entityId,
        localVersion,
        serverVersion,
      },
    });
  }

  private async applyConflictResolution(entityType: string, entityId: string, data: any, userId: string) {
    switch (entityType) {
      case 'track':
        await this.prisma.track.update({
          where: { id: entityId },
          data,
        });
        break;
      case 'playlist':
        await this.prisma.playlist.update({
          where: { id: entityId },
          data,
        });
        break;
      // Add other entity types...
    }
  }

  async getSyncLogs(userId: string, limit = 20) {
    return this.prisma.syncLog.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { device: { select: { deviceName: true, deviceType: true } } },
    });
  }
}
