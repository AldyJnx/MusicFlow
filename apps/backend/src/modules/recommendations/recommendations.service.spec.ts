import { PrismaService } from "@/prisma/prisma.service";
import { RecommendationCacheService } from "./recommendation-cache.service";
import { RecommendationsService } from "./recommendations.service";

describe("RecommendationsService", () => {
  it("returns six tracks with at most two from one artist", async () => {
    const now = new Date("2026-08-16T12:00:00.000Z");
    const candidate = (id: string, artistId: string, artist: string) => ({
      id,
      userId: "catalog-owner",
      title: `Track ${id}`,
      artist,
      album: "Album",
      genre: "Pop",
      durationMs: 180000,
      coverArt: null,
      artistImage: null,
      fileUrlRemote: `https://audio.test/${id}.wav`,
      artistId,
      source: "SYNCED",
      syncStatus: "SYNCED",
      createdAt: now,
      updatedAt: now,
    });
    const candidates = [
      candidate("a1", "artist-a", "Artist A"),
      candidate("a2", "artist-a", "Artist A"),
      candidate("a3", "artist-a", "Artist A"),
      candidate("b1", "artist-b", "Artist B"),
      candidate("c1", "artist-c", "Artist C"),
      candidate("d1", "artist-d", "Artist D"),
      candidate("e1", "artist-e", "Artist E"),
    ];
    const prisma = {
      track: { findMany: jest.fn().mockResolvedValue(candidates) },
      artistFollow: {
        findMany: jest.fn().mockResolvedValue([{ artistId: "artist-a" }]),
      },
      playHistory: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      userLibrarySave: { findMany: jest.fn().mockResolvedValue([]) },
      recommendationImpression: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 6 }),
      },
    } as unknown as PrismaService;
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as RecommendationCacheService;

    const result = await new RecommendationsService(prisma, cache).home(
      "user-1",
      6,
    );

    expect(result.tracks).toHaveLength(6);
    const artistACount = result.tracks.filter(
      (track) => track.artist === "Artist A",
    ).length;
    expect(artistACount).toBeLessThanOrEqual(2);
    expect(cache.set).toHaveBeenCalledTimes(1);
  });

  it("returns the cached ranking without querying Prisma", async () => {
    const cached = { tracks: [], generatedAt: "2026-08-16T12:00:00.000Z" };
    const prisma = {
      track: { findMany: jest.fn() },
    } as unknown as PrismaService;
    const cache = {
      get: jest.fn().mockResolvedValue(cached),
    } as unknown as RecommendationCacheService;

    const result = await new RecommendationsService(prisma, cache).home(
      "user-1",
      6,
    );

    expect(result).toEqual(cached);
    expect(prisma.track.findMany).not.toHaveBeenCalled();
  });
});
