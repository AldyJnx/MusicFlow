import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      premiumUsers,
      totalTracks,
      totalPlaylists,
      totalAiRequests,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isPremium: true } }),
      this.prisma.track.count(),
      this.prisma.playlist.count(),
      this.prisma.aIRequest.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      users: { total: totalUsers, premium: premiumUsers, recentWeek: recentUsers },
      content: { tracks: totalTracks, playlists: totalPlaylists },
      ai: { totalRequests: totalAiRequests },
    };
  }

  async getUsers(params?: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 50, search } = params || {};

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isPremium: true,
          isActive: true,
          createdAt: true,
          _count: { select: { tracks: true, playlists: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, skip, take };
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'CLIENT') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async updateUserPremium(userId: string, isPremium: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isPremium },
    });
  }

  async deactivateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async getAiFeedbackStats() {
    const [goodCount, badCount, neutralCount] = await Promise.all([
      this.prisma.aIRequest.count({ where: { feedback: 'GOOD' } }),
      this.prisma.aIRequest.count({ where: { feedback: 'BAD' } }),
      this.prisma.aIRequest.count({ where: { feedback: 'NEUTRAL' } }),
    ]);

    const total = goodCount + badCount + neutralCount;

    return {
      total,
      good: goodCount,
      bad: badCount,
      neutral: neutralCount,
      satisfactionRate: total > 0 ? (goodCount / total) * 100 : 0,
    };
  }

  async getRecentAiRequests(limit = 20) {
    return this.prisma.aIRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true, username: true } },
        track: { select: { title: true, artist: true } },
      },
    });
  }
}
