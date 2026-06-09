import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { QuotaService } from "./quota.service";
import { FREE_LIMITS, PREMIUM_LIMITS } from "./billing.constants";

describe("QuotaService", () => {
  let service: QuotaService;
  let prisma: {
    track: { count: jest.Mock };
    aIRequest: { count: jest.Mock };
    eQPreset: { count: jest.Mock };
  };

  const freeUser = { id: "u1", isPremium: false };
  const premiumUser = { id: "u2", isPremium: true };

  beforeEach(() => {
    prisma = {
      track: { count: jest.fn() },
      aIRequest: { count: jest.fn() },
      eQPreset: { count: jest.fn() },
    };
    service = new QuotaService(prisma as unknown as PrismaService);
  });

  describe("upload quota", () => {
    it("returns infinite remaining for premium users without hitting the DB", async () => {
      const quota = await service.getUploadQuota(premiumUser);
      expect(quota.remaining).toBe(Number.POSITIVE_INFINITY);
      expect(quota.isPremium).toBe(true);
      expect(prisma.track.count).not.toHaveBeenCalled();
    });

    it("counts existing tracks for free users", async () => {
      prisma.track.count.mockResolvedValue(10);
      const quota = await service.getUploadQuota(freeUser);
      expect(quota.used).toBe(10);
      expect(quota.limit).toBe(FREE_LIMITS.uploadsTotal);
      expect(quota.remaining).toBe(FREE_LIMITS.uploadsTotal - 10);
    });

    it("assertUploadQuota throws when free user is at limit", async () => {
      prisma.track.count.mockResolvedValue(FREE_LIMITS.uploadsTotal);
      await expect(service.assertUploadQuota(freeUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("assertUploadQuota passes when free user is below limit", async () => {
      prisma.track.count.mockResolvedValue(FREE_LIMITS.uploadsTotal - 1);
      await expect(
        service.assertUploadQuota(freeUser),
      ).resolves.toBeUndefined();
    });

    it("attaches QUOTA_UPLOADS_EXCEEDED code on rejection", async () => {
      prisma.track.count.mockResolvedValue(FREE_LIMITS.uploadsTotal);
      try {
        await service.assertUploadQuota(freeUser);
        fail("expected throw");
      } catch (err) {
        const response = (err as ForbiddenException).getResponse() as {
          code: string;
        };
        expect(response.code).toBe("QUOTA_UPLOADS_EXCEEDED");
      }
    });
  });

  describe("AI quota", () => {
    it("uses free limit for non-premium users", async () => {
      prisma.aIRequest.count.mockResolvedValue(3);
      const quota = await service.getAiQuota(freeUser);
      expect(quota.limit).toBe(FREE_LIMITS.aiRequestsPerMonth);
      expect(quota.used).toBe(3);
      expect(quota.remaining).toBe(FREE_LIMITS.aiRequestsPerMonth - 3);
    });

    it("uses premium limit for premium users", async () => {
      prisma.aIRequest.count.mockResolvedValue(50);
      const quota = await service.getAiQuota(premiumUser);
      expect(quota.limit).toBe(PREMIUM_LIMITS.aiRequestsPerMonth);
      expect(quota.remaining).toBe(PREMIUM_LIMITS.aiRequestsPerMonth - 50);
    });

    it("queries only the current calendar month", async () => {
      prisma.aIRequest.count.mockResolvedValue(0);
      await service.getAiQuota(freeUser);
      const args = prisma.aIRequest.count.mock.calls[0][0];
      expect(args.where.userId).toBe(freeUser.id);
      expect(args.where.createdAt.gte).toBeInstanceOf(Date);
      expect(args.where.createdAt.lt).toBeInstanceOf(Date);
      const span =
        args.where.createdAt.lt.getTime() - args.where.createdAt.gte.getTime();
      // Months span 28..31 days
      expect(span).toBeGreaterThanOrEqual(28 * 24 * 3600 * 1000);
      expect(span).toBeLessThanOrEqual(31 * 24 * 3600 * 1000);
    });

    it("assertAiQuota throws QUOTA_AI_EXCEEDED at limit", async () => {
      prisma.aIRequest.count.mockResolvedValue(FREE_LIMITS.aiRequestsPerMonth);
      try {
        await service.assertAiQuota(freeUser);
        fail("expected throw");
      } catch (err) {
        const response = (err as ForbiddenException).getResponse() as {
          code: string;
        };
        expect(response.code).toBe("QUOTA_AI_EXCEEDED");
      }
    });

    it("reports resetAt as next-month-start UTC", async () => {
      prisma.aIRequest.count.mockResolvedValue(0);
      const quota = await service.getAiQuota(freeUser);
      expect(quota.resetAt).toBeDefined();
      expect(quota.resetAt!.getUTCDate()).toBe(1);
      expect(quota.resetAt!.getUTCHours()).toBe(0);
    });
  });

  describe("custom preset quota", () => {
    it("returns infinite for premium without DB hit", async () => {
      const quota = await service.getCustomPresetQuota(premiumUser);
      expect(quota.remaining).toBe(Number.POSITIVE_INFINITY);
      expect(prisma.eQPreset.count).not.toHaveBeenCalled();
    });

    it("counts only user-owned non-global presets for free users", async () => {
      prisma.eQPreset.count.mockResolvedValue(2);
      const quota = await service.getCustomPresetQuota(freeUser);
      expect(prisma.eQPreset.count).toHaveBeenCalledWith({
        where: { userId: freeUser.id, isGlobal: false },
      });
      expect(quota.used).toBe(2);
      expect(quota.limit).toBe(FREE_LIMITS.customPresets);
    });

    it("assertCustomPresetQuota throws at limit", async () => {
      prisma.eQPreset.count.mockResolvedValue(FREE_LIMITS.customPresets);
      await expect(
        service.assertCustomPresetQuota(freeUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
