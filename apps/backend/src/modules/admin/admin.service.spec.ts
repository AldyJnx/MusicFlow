import { AdminService, parseAiUsageScope } from "./admin.service";

const NVIDIA_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const HAIKU_MODEL = "claude-haiku-4-5";
const BUCKET = new Date("2026-09-20T00:00:00.000Z");

type PrismaMock = Record<string, Record<string, jest.Mock>> & {
  $queryRaw: jest.Mock;
};

function isAdminScope(args: { where?: unknown }) {
  const where = JSON.stringify(args.where ?? {});
  return where.includes("NVIDIA_ADMIN") && !where.includes("NOT");
}

function todayUtc() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function playerRow(overrides: {
  requests: bigint;
  tokensInput: bigint;
  tokensOutput: bigint;
  fulfilled?: bigint;
  unfulfilled?: bigint;
}) {
  return {
    bucket: BUCKET,
    requests: overrides.requests,
    tokensInput: overrides.tokensInput,
    tokensOutput: overrides.tokensOutput,
    fulfilled: overrides.fulfilled ?? 0n,
    unfulfilled: overrides.unfulfilled ?? 0n,
  };
}

describe("AdminService.getAiCosts", () => {
  let service: AdminService;
  let prisma: PrismaMock;
  let usageQueryCount: number;
  let modelQueryCount: number;

  beforeEach(() => {
    usageQueryCount = 0;
    modelQueryCount = 0;
    prisma = {
      aIRequest: {
        aggregate: jest.fn((args: { where?: { user?: { role?: unknown } } }) =>
          Promise.resolve(
            isAdminScope(args)
              ? {
                  _count: { _all: 2 },
                  _sum: {
                    tokensInput: 100,
                    tokensOutput: 50,
                    costUsd: 0.002,
                    responseTimeMs: 400,
                  },
                }
              : {
                  _count: { _all: 10 },
                  _sum: {
                    tokensInput: 5000,
                    tokensOutput: 2000,
                    costUsd: 0.01,
                    responseTimeMs: 2000,
                  },
                },
          ),
        ),
        groupBy: jest.fn((args: { by: string[]; where?: unknown }) => {
          if (args.by[0] === "userId") {
            return Promise.resolve([
              {
                userId: "user-1",
                _count: { _all: 10 },
                _sum: { costUsd: 0.01 },
              },
            ]);
          }
          if (args.by[0] === "appliedTo") {
            return Promise.resolve([
              { appliedTo: "GLOBAL", userId: "user-1", _count: { _all: 10 } },
            ]);
          }
          const isAdmin = isAdminScope(args);
          return Promise.resolve(
            isAdmin
              ? [
                  {
                    modelUsed: NVIDIA_MODEL,
                    _count: { _all: 2 },
                    _sum: { tokensInput: 100, tokensOutput: 50, costUsd: 0 },
                  },
                ]
              : [
                  {
                    modelUsed: HAIKU_MODEL,
                    _count: { _all: 10 },
                    _sum: {
                      tokensInput: 5000,
                      tokensOutput: 2000,
                      costUsd: 0.01,
                    },
                  },
                ],
          );
        }),
      },
      catalogAiRun: {
        aggregate: jest.fn().mockResolvedValue({
          _count: { _all: 3 },
          _sum: { tokensInput: 900, tokensOutput: 300, responseTimeMs: 6000 },
        }),
        groupBy: jest.fn().mockResolvedValue([
          {
            modelUsed: NVIDIA_MODEL,
            _count: { _all: 3 },
            _sum: { tokensInput: 900, tokensOutput: 300 },
          },
        ]),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn((strings: TemplateStringsArray) => {
        const sql = strings.join(" ");
        if (sql.includes('AS "latencyMs"')) {
          usageQueryCount += 1;
          return Promise.resolve([
            usageQueryCount % 2 === 1
              ? {
                  requests: 10n,
                  costUsd: 0.01,
                  tokensInput: 5000n,
                  tokensOutput: 2000n,
                  latencyMs: 2000n,
                }
              : {
                  requests: 2n,
                  costUsd: 0.002,
                  tokensInput: 100n,
                  tokensOutput: 50n,
                  latencyMs: 400n,
                },
          ]);
        }
        if (sql.includes('GROUP BY r."model_used"')) {
          modelQueryCount += 1;
          return Promise.resolve(
            modelQueryCount % 2 === 1
              ? [
                  {
                    modelUsed: HAIKU_MODEL,
                    requests: 10n,
                    costUsd: 0.01,
                    tokensInput: 5000n,
                    tokensOutput: 2000n,
                  },
                ]
              : [
                  {
                    modelUsed: NVIDIA_MODEL,
                    requests: 2n,
                    costUsd: 0,
                    tokensInput: 100n,
                    tokensOutput: 50n,
                  },
                ],
          );
        }
        if (sql.includes("SUM(cost)")) {
          return Promise.resolve([
            { day: todayUtc(), cost: 0.012, requests: 15n },
          ]);
        }
        if (sql.includes('FROM "ai_requests"')) {
          return Promise.resolve([
            playerRow({
              requests: 12n,
              tokensInput: 5100n,
              tokensOutput: 2050n,
              fulfilled: 4n,
              unfulfilled: 8n,
            }),
          ]);
        }
        if (sql.includes("GREATEST")) {
          return Promise.resolve([
            playerRow({
              requests: 3n,
              tokensInput: 900n,
              tokensOutput: 300n,
              fulfilled: 2n,
              unfulfilled: 1n,
            }),
          ]);
        }
        return Promise.resolve([]);
      }),
    } as unknown as PrismaMock;
    service = new AdminService(prisma as never);
  });

  it("adds the NVIDIA catalog consumption to the model breakdown", async () => {
    const report = await service.getAiCosts(30);

    const nvidia = report.byModel.find((model) => model.model === NVIDIA_MODEL);
    expect(nvidia).toEqual({
      model: NVIDIA_MODEL,
      origin: "ADMINS",
      // 2 admin assistant questions + 3 catalog runs.
      requests: 5,
      costUsd: 0,
      tokensInput: 1000,
      tokensOutput: 350,
    });
    expect(report.byModel[0]?.model).toBe(HAIKU_MODEL);
  });

  it("merges both origins into the totals and exposes them per source", async () => {
    const report = await service.getAiCosts(30);

    expect(report.scope).toBe("all");
    expect(report.totals.requests).toBe(15);
    expect(report.totals.tokensInput).toBe(6000);
    expect(report.totals.tokensOutput).toBe(2350);
    expect(report.sources.user.requests).toBe(10);
    expect(report.sources.admin.requests).toBe(5);
    expect(report.sources.admin.tokensInput).toBe(1000);
    expect(report.sources.all.requests).toBe(15);
  });

  it("merges NVIDIA runs into the same period bucket", async () => {
    const report = await service.getAiCosts(30);

    const point = report.activity.day.find(
      (item) => item.date === BUCKET.toISOString(),
    );
    expect(point).toEqual({
      date: BUCKET.toISOString(),
      requests: 15,
      tokensInput: 6000,
      tokensOutput: 2350,
      fulfilled: 6,
      unfulfilled: 9,
    });
    expect(report.activity.month).toHaveLength(1);
    expect(report.activity.year).toHaveLength(1);
  });

  it("includes NVIDIA usage in the daily series", async () => {
    const report = await service.getAiCosts(2);

    expect(report.daily).toHaveLength(2);
    expect(report.daily[1]?.requests).toBe(15);
    expect(report.daily[1]?.cost).toBeCloseTo(0.012, 6);
  });

  it("keeps the end-user scope free of any admin consumption", async () => {
    const report = await service.getAiCosts(30, "user");

    expect(report.scope).toBe("user");
    expect(report.totals.requests).toBe(10);
    expect(report.totals.tokensInput).toBe(5000);
    expect(report.byModel).toEqual([
      {
        model: HAIKU_MODEL,
        origin: "USERS",
        requests: 10,
        costUsd: 0.01,
        tokensInput: 5000,
        tokensOutput: 2000,
      },
    ]);
    expect(prisma.catalogAiRun.groupBy).not.toHaveBeenCalled();
    const rawSql = prisma.$queryRaw.mock.calls
      .map((call: unknown[]) => JSON.stringify(call[0]))
      .join("\n");
    expect(rawSql).not.toContain("GREATEST");
  });

  it("separates products by request source rather than the account role", async () => {
    await service.getAiCosts(30, "admin");

    const rawSql = prisma.$queryRaw.mock.calls
      .map((call: unknown[]) => (call[0] as TemplateStringsArray).join(" "))
      .join("\n");

    expect(rawSql).toContain('GROUP BY r."model_used"');
    expect(rawSql).not.toContain('"role"');
  });

  it("limits the admin scope to admin requests and catalog runs", async () => {
    const report = await service.getAiCosts(30, "admin");

    expect(report.totals.requests).toBe(5);
    expect(report.byModel.every((model) => model.origin === "ADMINS")).toBe(
      true,
    );
    expect(report.byModel.map((model) => model.model)).toEqual([NVIDIA_MODEL]);
  });

  it("falls back to every origin for an unknown scope", async () => {
    const report = await service.getAiCosts(
      30,
      "inventado" as unknown as "all",
    );

    expect(report.scope).toBe("all");
    expect(report.totals.requests).toBe(15);
  });
});

describe("parseAiUsageScope", () => {
  it("accepts the three supported scopes", () => {
    expect(parseAiUsageScope("all")).toBe("all");
    expect(parseAiUsageScope("USER")).toBe("user");
    expect(parseAiUsageScope(" admin ")).toBe("admin");
    expect(parseAiUsageScope(["admin"])).toBe("admin");
  });

  it("defaults to every origin", () => {
    expect(parseAiUsageScope(undefined)).toBe("all");
    expect(parseAiUsageScope("root")).toBe("all");
    expect(parseAiUsageScope(7)).toBe("all");
  });
});

describe("AdminService.getMusicInsights", () => {
  it("ranks only catalog tracks that still belong to an existing artist", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      artist: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new AdminService(prisma as never);

    const report = await service.getMusicInsights();
    const rankingQueries = prisma.$queryRaw.mock.calls
      .slice(0, 3)
      .map((call: unknown[]) => (call[0] as TemplateStringsArray).join(" "));

    expect(report.leastPlayed).toEqual([]);
    expect(report.mostPlayed).toEqual([]);
    expect(prisma.artist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tracks: { some: { isCatalog: true } } },
      }),
    );
    expect(rankingQueries).toHaveLength(3);
    for (const sql of rankingQueries) {
      expect(sql).toContain("INNER JOIN artists a ON a.id = t.artist_id");
      expect(sql).toContain("WHERE t.is_catalog = true");
    }
  });
});

describe("AdminService.deleteCatalogGenre", () => {
  it("removes a genre from its catalog entry, artists and tracks atomically", async () => {
    const catalogGenre = {
      findUnique: jest.fn().mockResolvedValue({ id: "genre-1", name: "Salsa" }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const track = {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    };
    const artist = {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: "artist-1", genres: ["Salsa", "Tropical"] }]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const prisma = {
      catalogGenre,
      track,
      artist,
      $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const service = new AdminService(prisma as never);

    await service.deleteCatalogGenre("genre-1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(catalogGenre.delete).toHaveBeenCalledWith({
      where: { id: "genre-1" },
    });
    expect(track.updateMany).toHaveBeenCalledWith({
      where: { genre: "Salsa" },
      // `genre` is a required legacy column: null would make the transaction
      // fail and leave the genre undeleted.
      data: { genre: "" },
    });
    expect(artist.update).toHaveBeenCalledWith({
      where: { id: "artist-1" },
      data: { genres: ["Tropical"] },
    });
  });
});
