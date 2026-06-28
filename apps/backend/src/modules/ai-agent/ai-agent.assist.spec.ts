import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { SegmentsService } from "@/modules/equalizer/segments.service";
import { AiAgentService } from "./ai-agent.service";

/**
 * Exercises the flexible assistant via its mock path (no ANTHROPIC_API_KEY),
 * which still runs the real taste-profile aggregation, candidate gathering and
 * id resolution — only the model call is replaced by the deterministic stub.
 */
describe("AiAgentService.assist (mock path)", () => {
  let service: AiAgentService;
  let prisma: {
    playHistory: { findMany: jest.Mock };
    userLibrarySave: { findMany: jest.Mock };
    track: { findMany: jest.Mock; findFirst: jest.Mock };
    aIRequest: { create: jest.Mock };
  };

  const candidates = [
    {
      id: "t-pop-1",
      title: "Pop Hit",
      artist: "A",
      album: "X",
      genre: "Pop",
      coverArt: null,
      durationMs: 1000,
      fileUrlRemote: "https://r2/1",
    },
    {
      id: "t-pop-2",
      title: "Another Pop",
      artist: "B",
      album: "Y",
      genre: "Pop",
      coverArt: null,
      durationMs: 1000,
      fileUrlRemote: "https://r2/2",
    },
    {
      id: "t-rock-1",
      title: "Rock Song",
      artist: "C",
      album: "Z",
      genre: "Rock",
      coverArt: null,
      durationMs: 1000,
      fileUrlRemote: "https://r2/3",
    },
  ];

  beforeEach(() => {
    prisma = {
      playHistory: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { track: { artist: "A", genre: "Pop", title: "Pop Hit" } },
            { track: { artist: "A", genre: "Pop", title: "Pop Hit" } },
            { track: { artist: "C", genre: "Rock", title: "Rock Song" } },
          ]),
      },
      userLibrarySave: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ track: { artist: "A", genre: "Pop" } }]),
      },
      track: {
        findMany: jest.fn().mockResolvedValue(candidates),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      aIRequest: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: "req-1",
          ...data,
        })),
      },
    };

    const config = {
      get: jest.fn((key: string, def?: string) =>
        key === "ANTHROPIC_API_KEY" ? undefined : def,
      ),
    } as unknown as ConfigService;

    service = new AiAgentService(
      prisma as unknown as PrismaService,
      config,
      {} as unknown as SegmentsService,
    );
  });

  it("treats a sound-related prompt as an EQ tweak", async () => {
    const res = await service.assist("u1", { prompt: "ponle más bajos" });
    expect(res.intent).toBe("eq");
    expect(res.eq).toBeDefined();
    expect(res.eq!.bands).toHaveLength(10);
    expect(res.tracks).toBeUndefined();
  });

  it("boosts vocals when asked for voice clarity", async () => {
    const res = await service.assist("u1", { prompt: "realza la voz" });
    expect(res.intent).toBe("eq");
    // Mid bands (vocal range) should be lifted above the lowest band.
    expect(res.eq!.bands[4]).toBeGreaterThan(res.eq!.bands[0]);
  });

  it("recommends real catalog tracks for a listening request", async () => {
    const res = await service.assist("u1", {
      prompt: "ponme algo para el gym",
    });
    expect(res.intent).toBe("recommend");
    expect(res.tracks && res.tracks.length).toBeGreaterThan(0);
    // Every recommended track is a real candidate (never hallucinated).
    const ids = new Set(candidates.map((c) => c.id));
    for (const t of res.tracks!) expect(ids.has(t.id)).toBe(true);
  });

  it("prefers the user's top genre (Pop) in recommendations", async () => {
    const res = await service.assist("u1", { prompt: "sorpréndeme" });
    expect(res.intent).toBe("recommend");
    expect(res.genres).toContain("Pop");
    // Pop dominates the play history, so picks should include Pop tracks.
    expect(res.tracks!.some((t) => t.genre === "Pop")).toBe(true);
  });

  it("persists the exchange with the resolved track ids", async () => {
    await service.assist("u1", { prompt: "recomiéndame algo" });
    expect(prisma.aIRequest.create).toHaveBeenCalledTimes(1);
    const arg = prisma.aIRequest.create.mock.calls[0][0];
    expect(arg.data.userId).toBe("u1");
    expect(arg.data.response.intent).toBe("recommend");
    expect(Array.isArray(arg.data.response.trackIds)).toBe(true);
  });
});
