import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RecommendationCacheService } from "@/modules/recommendations/recommendation-cache.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendationCache: RecommendationCacheService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        isPremium: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        onboardingCompletedAt: true,
        lastActiveAt: true,
        notificationConsent: true,
        timezone: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException("Username already taken");
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.username) updateData.username = dto.username;
    if (dto.avatar) updateData.avatar = dto.avatar;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        isPremium: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteAccount(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async completeOnboarding(userId: string, artistIds: string[]) {
    const uniqueArtistIds = [...new Set(artistIds)];
    if (uniqueArtistIds.length !== artistIds.length) {
      throw new ConflictException("Artist selection contains duplicates");
    }

    const artistCount = await this.prisma.artist.count({
      where: { id: { in: uniqueArtistIds } },
    });
    if (artistCount !== uniqueArtistIds.length) {
      throw new NotFoundException("One or more artists were not found");
    }

    const completedAt = new Date();
    await this.prisma.$transaction([
      ...uniqueArtistIds.map((artistId) =>
        this.prisma.artistFollow.upsert({
          where: { userId_artistId: { userId, artistId } },
          create: { userId, artistId, source: "ONBOARDING" },
          update: {},
        }),
      ),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompletedAt: completedAt,
          lastActiveAt: completedAt,
          reengagementNotifiedAt: null,
        },
      }),
    ]);
    await this.recommendationCache.invalidate(userId);
    return { completedAt, selectedArtistCount: uniqueArtistIds.length };
  }

  async listFollowedArtists(userId: string) {
    const follows = await this.prisma.artistFollow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        artist: {
          include: { _count: { select: { albums: true, tracks: true } } },
        },
      },
    });
    return follows.map(({ artist, source, createdAt }) => ({
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      imageUrl: artist.imageUrl,
      genres: artist.genres,
      albumCount: artist._count.albums,
      trackCount: artist._count.tracks,
      source,
      followedAt: createdAt,
    }));
  }

  async recordActivity(
    userId: string,
    data: { timezone?: string; notificationConsent?: boolean },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        reengagementNotifiedAt: null,
        timezone: data.timezone,
        notificationConsent: data.notificationConsent,
      },
      select: {
        lastActiveAt: true,
        notificationConsent: true,
        timezone: true,
      },
    });
    return user;
  }
}
