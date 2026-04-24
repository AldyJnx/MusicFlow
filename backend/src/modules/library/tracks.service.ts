import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TracksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, params?: {
    skip?: number;
    take?: number;
    search?: string;
    artist?: string;
    album?: string;
    genre?: string;
  }) {
    const { skip = 0, take = 50, search, artist, album, genre } = params || {};

    const where: Prisma.TrackWhereInput = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
        { album: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (artist) where.artist = { contains: artist, mode: 'insensitive' };
    if (album) where.album = { contains: album, mode: 'insensitive' };
    if (genre) where.genre = { contains: genre, mode: 'insensitive' };

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take,
        orderBy: [{ artist: 'asc' }, { album: 'asc' }, { trackNumber: 'asc' }],
      }),
      this.prisma.track.count({ where }),
    ]);

    return { tracks, total, skip, take };
  }

  async findById(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, userId },
      include: {
        segments: {
          include: { eqConfig: true },
          orderBy: { startMs: 'asc' },
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return track;
  }

  async create(userId: string, data: Prisma.TrackCreateWithoutUserInput) {
    return this.prisma.track.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async update(id: string, userId: string, data: Prisma.TrackUpdateInput) {
    const track = await this.prisma.track.findFirst({
      where: { id, userId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return this.prisma.track.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { id, userId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return this.prisma.track.delete({ where: { id } });
  }

  async getArtists(userId: string) {
    const tracks = await this.prisma.track.findMany({
      where: { userId },
      select: { artist: true },
      distinct: ['artist'],
      orderBy: { artist: 'asc' },
    });

    return tracks.map(t => t.artist);
  }

  async getAlbums(userId: string, artist?: string) {
    const where: Prisma.TrackWhereInput = { userId };
    if (artist) where.artist = artist;

    const tracks = await this.prisma.track.findMany({
      where,
      select: { album: true, albumArtist: true, coverArt: true },
      distinct: ['album'],
      orderBy: { album: 'asc' },
    });

    return tracks;
  }

  async getGenres(userId: string) {
    const tracks = await this.prisma.track.findMany({
      where: { userId, genre: { not: '' } },
      select: { genre: true },
      distinct: ['genre'],
      orderBy: { genre: 'asc' },
    });

    return tracks.map(t => t.genre);
  }
}
