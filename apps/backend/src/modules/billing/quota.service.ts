import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { FREE_LIMITS, PREMIUM_LIMITS } from "./billing.constants";

interface QuotaUser {
  id: string;
  isPremium: boolean;
}

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  resetAt?: Date;
}

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getUploadQuota(user: QuotaUser): Promise<QuotaStatus> {
    if (user.isPremium) {
      return {
        used: 0,
        limit: Number.POSITIVE_INFINITY,
        remaining: Number.POSITIVE_INFINITY,
        isPremium: true,
      };
    }

    const used = await this.prisma.track.count({
      where: { userId: user.id },
    });

    return {
      used,
      limit: FREE_LIMITS.uploadsTotal,
      remaining: Math.max(0, FREE_LIMITS.uploadsTotal - used),
      isPremium: false,
    };
  }

  async assertUploadQuota(user: QuotaUser): Promise<void> {
    const quota = await this.getUploadQuota(user);
    if (quota.remaining <= 0) {
      throw new ForbiddenException({
        message: `Free tier upload limit reached (${quota.limit}). Upgrade to premium for unlimited uploads.`,
        code: "QUOTA_UPLOADS_EXCEEDED",
        quota,
      });
    }
  }

  async getAiQuota(user: QuotaUser): Promise<QuotaStatus> {
    const { start, end } = currentMonthRange();
    const limit = user.isPremium
      ? PREMIUM_LIMITS.aiRequestsPerMonth
      : FREE_LIMITS.aiRequestsPerMonth;

    const used = await this.prisma.aIRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: start, lt: end },
      },
    });

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      isPremium: user.isPremium,
      resetAt: end,
    };
  }

  async assertAiQuota(user: QuotaUser): Promise<void> {
    const quota = await this.getAiQuota(user);
    if (quota.remaining <= 0) {
      throw new ForbiddenException({
        message: user.isPremium
          ? `Monthly AI request limit reached (${quota.limit}).`
          : `Free tier AI limit reached (${quota.limit}/month). Upgrade to premium for ${PREMIUM_LIMITS.aiRequestsPerMonth}/month.`,
        code: "QUOTA_AI_EXCEEDED",
        quota,
      });
    }
  }

  async getCustomPresetQuota(user: QuotaUser): Promise<QuotaStatus> {
    if (user.isPremium) {
      return {
        used: 0,
        limit: Number.POSITIVE_INFINITY,
        remaining: Number.POSITIVE_INFINITY,
        isPremium: true,
      };
    }

    const used = await this.prisma.eQPreset.count({
      where: { userId: user.id, isGlobal: false },
    });

    return {
      used,
      limit: FREE_LIMITS.customPresets,
      remaining: Math.max(0, FREE_LIMITS.customPresets - used),
      isPremium: false,
    };
  }

  async assertCustomPresetQuota(user: QuotaUser): Promise<void> {
    const quota = await this.getCustomPresetQuota(user);
    if (quota.remaining <= 0) {
      throw new ForbiddenException({
        message: `Free tier preset limit reached (${quota.limit}). Upgrade to premium for unlimited presets.`,
        code: "QUOTA_PRESETS_EXCEEDED",
        quota,
      });
    }
  }
}

function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { start, end };
}
