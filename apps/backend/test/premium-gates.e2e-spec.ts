import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import * as request from "supertest";

import { EqualizerModule } from "@/modules/equalizer/equalizer.module";
import { AiAgentModule } from "@/modules/ai-agent/ai-agent.module";
import { LibraryModule } from "@/modules/library/library.module";
import { BillingModule } from "@/modules/billing/billing.module";
import { PrismaService } from "@/prisma/prisma.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { StorageModule } from "@/modules/storage/storage.module";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

/**
 * E2E specs that prove the premium gates and quota counters wire end-to-end
 * (controller → guard → service → Prisma) by hitting the real Nest app via
 * supertest. Auth is bypassed with a fake JwtAuthGuard that injects whichever
 * user the test cares about; everything else is real code paths.
 */

interface FakeUser {
  id: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  isPremium: boolean;
}

const FREE_USER: FakeUser = {
  id: "u-free",
  email: "free@test.com",
  role: "CLIENT",
  isPremium: false,
};

const PREMIUM_USER: FakeUser = {
  id: "u-premium",
  email: "premium@test.com",
  role: "CLIENT",
  isPremium: true,
};

let currentUser: FakeUser = FREE_USER;

class StubAuthGuard {
  canActivate(ctx: { switchToHttp: () => { getRequest: () => { user: FakeUser } } }) {
    ctx.switchToHttp().getRequest().user = currentUser;
    return true;
  }
}

describe("Premium gates + quotas (e2e)", () => {
  let app: INestApplication;

  // Prisma mock counters — each test can override per-call.
  const prismaMock = {
    track: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    aIRequest: {
      count: jest.fn(),
      create: jest.fn(),
    },
    eQPreset: {
      count: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    // Stripe stays unset → BillingService logs a warn and returns 503 for
    // checkout. The premium guard and quota service don't touch Stripe so
    // these specs run without it.

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        // High limit + tiny ttl so the throttle decorator on /ai/suggest
        // doesn't reject specs running back-to-back.
        ThrottlerModule.forRoot([{ ttl: 1000, limit: 1000 }]),
        PrismaModule,
        StorageModule,
        BillingModule,
        LibraryModule,
        EqualizerModule,
        AiAgentModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useClass(StubAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = FREE_USER;
    // Default to "no rows" — individual tests override.
    prismaMock.track.count.mockResolvedValue(0);
    prismaMock.aIRequest.count.mockResolvedValue(0);
    prismaMock.eQPreset.count.mockResolvedValue(0);
  });

  describe("PremiumGuard — EQ segment writes", () => {
    it("free user gets 403 PREMIUM_REQUIRED on POST /equalizer/segments", async () => {
      currentUser = FREE_USER;
      const res = await request(app.getHttpServer())
        .post("/api/equalizer/segments")
        .send({
          trackId: "ignored-because-guard-fires-first",
          startMs: 0,
          endMs: 1000,
          bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        })
        .expect(403);
      expect(res.body.code).toBe("PREMIUM_REQUIRED");
      expect(res.body.message).toMatch(/premium/i);
    });

    it("free user gets 403 PREMIUM_REQUIRED on PATCH /equalizer/segments/:id", async () => {
      currentUser = FREE_USER;
      const res = await request(app.getHttpServer())
        .patch("/api/equalizer/segments/seg-1")
        .send({ label: "Coro" })
        .expect(403);
      expect(res.body.code).toBe("PREMIUM_REQUIRED");
    });
  });

  describe("AI quota — POST /ai/suggest", () => {
    it("free user under the cap reaches the service layer", async () => {
      currentUser = FREE_USER;
      prismaMock.aIRequest.count.mockResolvedValue(0);
      prismaMock.aIRequest.create.mockResolvedValue({
        id: "ai-1",
        prompt: "test",
      });
      // Without ANTHROPIC_API_KEY the service falls back to mock suggestions
      // and still records the AIRequest row — both paths exercise the gate.
      const res = await request(app.getHttpServer())
        .post("/api/ai/suggest")
        .send({ prompt: "hazlo mas calido" });
      // Either 201 (success) or 503/500 (mock branch on env). Anything other
      // than 403 proves the quota gate did NOT fire.
      expect(res.status).not.toBe(403);
    });

    it("free user at the cap gets 403 QUOTA_AI_EXCEEDED with the quota payload", async () => {
      currentUser = FREE_USER;
      prismaMock.aIRequest.count.mockResolvedValue(10); // FREE_LIMITS.aiRequestsPerMonth
      const res = await request(app.getHttpServer())
        .post("/api/ai/suggest")
        .send({ prompt: "ignored — quota check fires first" })
        .expect(403);
      expect(res.body.code).toBe("QUOTA_AI_EXCEEDED");
      expect(res.body.quota.used).toBe(10);
      expect(res.body.quota.limit).toBe(10);
      expect(res.body.quota.resetAt).toBeDefined();
      // The AIRequest should NOT have been created — the gate fired first.
      expect(prismaMock.aIRequest.create).not.toHaveBeenCalled();
    });

    it("premium user has the higher cap (200/month)", async () => {
      currentUser = PREMIUM_USER;
      prismaMock.aIRequest.count.mockResolvedValue(199);
      prismaMock.aIRequest.create.mockResolvedValue({
        id: "ai-2",
        prompt: "test",
      });
      const res = await request(app.getHttpServer())
        .post("/api/ai/suggest")
        .send({ prompt: "subi un poco los agudos" });
      expect(res.status).not.toBe(403);
    });

    it("premium user at 200/month also blocks", async () => {
      currentUser = PREMIUM_USER;
      prismaMock.aIRequest.count.mockResolvedValue(200);
      const res = await request(app.getHttpServer())
        .post("/api/ai/suggest")
        .send({ prompt: "x" })
        .expect(403);
      expect(res.body.code).toBe("QUOTA_AI_EXCEEDED");
    });
  });

  describe("Upload quota — POST /library/tracks", () => {
    it("free user at 50 uploads gets 403 QUOTA_UPLOADS_EXCEEDED", async () => {
      currentUser = FREE_USER;
      prismaMock.track.count.mockResolvedValue(50);
      const res = await request(app.getHttpServer())
        .post("/api/library/tracks")
        .send({
          title: "x",
          artist: "y",
          durationMs: 1000,
          fileHash: "abc",
          source: "LOCAL",
          syncStatus: "PENDING",
        })
        .expect(403);
      expect(res.body.code).toBe("QUOTA_UPLOADS_EXCEEDED");
    });

    it("premium user is never blocked by the upload quota", async () => {
      currentUser = PREMIUM_USER;
      // Even a ridiculous count shouldn't trip the gate.
      prismaMock.track.count.mockResolvedValue(10_000);
      // The service may still 400/500 for other reasons; we only assert it
      // is NOT 403 from the quota.
      const res = await request(app.getHttpServer())
        .post("/api/library/tracks")
        .send({
          title: "x",
          artist: "y",
          durationMs: 1000,
          fileHash: "abc",
          source: "LOCAL",
          syncStatus: "PENDING",
        });
      expect(res.status).not.toBe(403);
    });
  });

  describe("Custom preset quota — POST /equalizer/presets", () => {
    it("free user at 5 presets gets 403 QUOTA_PRESETS_EXCEEDED", async () => {
      currentUser = FREE_USER;
      prismaMock.eQPreset.count.mockResolvedValue(5);
      const res = await request(app.getHttpServer())
        .post("/api/equalizer/presets")
        .send({
          name: "My preset",
          bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        })
        .expect(403);
      expect(res.body.code).toBe("QUOTA_PRESETS_EXCEEDED");
    });
  });

  describe("GET /billing/quota", () => {
    it("free user — quota reflects current usage", async () => {
      currentUser = FREE_USER;
      prismaMock.track.count.mockResolvedValue(7);
      prismaMock.aIRequest.count.mockResolvedValue(3);
      prismaMock.eQPreset.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer())
        .get("/api/billing/quota")
        .expect(200);
      expect(res.body.isPremium).toBe(false);
      expect(res.body.uploads.used).toBe(7);
      expect(res.body.uploads.limit).toBe(50);
      expect(res.body.aiRequests.used).toBe(3);
      expect(res.body.aiRequests.limit).toBe(10);
      expect(res.body.customPresets.used).toBe(1);
      expect(res.body.customPresets.limit).toBe(5);
    });

    it("premium user — limits are reported as null (unlimited)", async () => {
      currentUser = PREMIUM_USER;
      prismaMock.aIRequest.count.mockResolvedValue(0);
      const res = await request(app.getHttpServer())
        .get("/api/billing/quota")
        .expect(200);
      expect(res.body.isPremium).toBe(true);
      expect(res.body.uploads.limit).toBeNull();
      expect(res.body.customPresets.limit).toBeNull();
      // AI does have a 200-cap on premium — limit is finite.
      expect(res.body.aiRequests.limit).toBe(200);
    });
  });
});
