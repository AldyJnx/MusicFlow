import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userId },
      include: {
        _count: { select: { tracks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, userId },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return playlist;
  }

  async findByShareToken(shareToken: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { shareToken, isPublic: true },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' },
        },
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found or not public');
    }

    return playlist;
  }

  async create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.playlist.create({
      data: {
        name: data.name,
        description: data.description || '',
        user: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string;
    coverArt?: string;
    isPublic?: boolean;
  }) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    const updateData: Record<string, unknown> = { ...data };

    // Generate share token if making public
    if (data.isPublic && !playlist.shareToken) {
      updateData.shareToken = randomBytes(16).toString('hex');
    }

    return this.prisma.playlist.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return this.prisma.playlist.delete({ where: { id } });
  }

  async addTrack(playlistId: string, userId: string, trackId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    // Get the next position
    const lastTrack = await this.prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
    });

    const position = (lastTrack?.position ?? -1) + 1;

    return this.prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        position,
      },
      include: { track: true },
    });
  }

  async removeTrack(playlistId: string, userId: string, trackId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return this.prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: { playlistId, trackId },
      },
    });
  }

  async reorderTracks(playlistId: string, userId: string, trackIds: string[]) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      trackIds.map((trackId, index) =>
        this.prisma.playlistTrack.update({
          where: {
            playlistId_trackId: { playlistId, trackId },
          },
          data: { position: index },
        }),
      ),
    );

    return this.findById(playlistId, userId);
  }
}
