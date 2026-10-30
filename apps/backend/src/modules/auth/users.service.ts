import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RecommendationCacheService } from "@/modules/recommendations/recommendation-cache.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly recommendationCache?: RecommendationCacheService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
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
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar;
    if (dto.bio !== undefined) updateData.bio = dto.bio.trim() || null;

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
        bio: true,
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
    await this.recommendationCache?.invalidate(userId);
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

  /**
   * Notifications are derived from published catalog activity rather than a
   * client-side mock. A release is visible only when it was published after
   * the user started following that artist.
   */
  async listNotifications(
    userId: string,
    params?: {
      page?: string | number;
      pageSize?: string | number;
      sort?: string;
      q?: string;
    },
  ) {
    const page = Math.max(1, Number(params?.page) || 1);
    const pageSize = Math.min(30, Math.max(1, Number(params?.pageSize) || 8));
    const query = params?.q?.trim().slice(0, 100).toLocaleLowerCase() ?? "";
    const tracks = await this.prisma.track.findMany({
      where: {
        isCatalog: true,
        artistRef: { followers: { some: { userId } } },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        artistRef: {
          select: {
            name: true,
            followers: {
              where: { userId },
              select: { createdAt: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const notifications = tracks
      .filter((track) => {
        const followedAt = track.artistRef?.followers[0]?.createdAt;
        return followedAt !== undefined && track.createdAt >= followedAt;
      })
      .map((track) => ({
        id: `release-${track.id}`,
        title: "Nuevo lanzamiento",
        artistName: track.artistRef?.name ?? "Artista",
        message: `${track.artistRef?.name ?? "Un artista que sigues"} publicó “${track.title}”.`,
        createdAt: track.createdAt,
      }))
      .filter((notification) =>
        !query
          ? true
          : `${notification.title} ${notification.artistName} ${notification.message}`
              .toLocaleLowerCase()
              .includes(query),
      );
    const allNotificationIds = notifications.map(
      (notification) => notification.id,
    );
    const reads = allNotificationIds.length
      ? await this.prisma.userNotificationRead.findMany({
          where: { userId, notificationId: { in: allNotificationIds } },
          select: { notificationId: true },
        })
      : [];
    const readIds = new Set(reads.map((read) => read.notificationId));
    const sort = params?.sort ?? "RECENT";
    notifications.sort((a, b) => {
      if (sort === "OLDEST")
        return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === "TITLE_ASC") return a.message.localeCompare(b.message);
      if (sort === "TITLE_DESC") return b.message.localeCompare(a.message);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    const items = notifications.map((notification) => ({
      ...notification,
      read: readIds.has(notification.id),
    }));
    const total = items.length;
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total,
      unreadCount: items.filter((notification) => !notification.read).length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async markNotificationsRead(userId: string, notificationIds?: string[]) {
    const availableIds = new Set<string>();
    let page = 1;
    let totalPages = 1;
    do {
      const notifications = await this.listNotifications(userId, {
        page,
        pageSize: 30,
        sort: "RECENT",
        q: "",
      });
      notifications.items.forEach((item) => availableIds.add(item.id));
      totalPages = notifications.totalPages;
      page += 1;
    } while (page <= totalPages);
    const ids = Array.from(
      new Set(
        notificationIds?.filter((id) => availableIds.has(id)) ?? [
          ...availableIds,
        ],
      ),
    );
    if (ids.length) {
      await this.prisma.userNotificationRead.createMany({
        data: ids.map((notificationId) => ({ userId, notificationId })),
        skipDuplicates: true,
      });
    }
    return { readCount: ids.length };
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
