import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { LibrarySavesService } from "./library-saves.service";

describe("LibrarySavesService", () => {
  let service: LibrarySavesService;
  let prisma: {
    track: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    userLibrarySave: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      track: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      userLibrarySave: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new LibrarySavesService(prisma as unknown as PrismaService);
  });

  describe("save", () => {
    it("creates a save row for a visible catalog track owned by someone else", async () => {
      prisma.track.findFirst.mockResolvedValue({
        id: "t1",
        userId: "owner",
        isCatalog: true,
      });
      prisma.userLibrarySave.create.mockResolvedValue({
        userId: "u1",
        trackId: "t1",
        savedAt: new Date("2026-06-09"),
      });

      const result = await service.save("u1", "t1");
      expect(result.implicit).toBe(false);
      expect(prisma.userLibrarySave.create).toHaveBeenCalledWith({
        data: { userId: "u1", trackId: "t1" },
      });
    });

    it("returns implicit save when the user owns the track", async () => {
      prisma.track.findFirst.mockResolvedValue({
        id: "t1",
        userId: "u1",
        isCatalog: false,
      });

      const result = await service.save("u1", "t1");
      expect(result.implicit).toBe(true);
      expect(prisma.userLibrarySave.create).not.toHaveBeenCalled();
    });

    it("returns 404 when the track is not visible to the user", async () => {
      prisma.track.findFirst.mockResolvedValue(null);
      await expect(service.save("u1", "tX")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("is idempotent — duplicate save returns existing row, not error", async () => {
      prisma.track.findFirst.mockResolvedValue({
        id: "t1",
        userId: "owner",
        isCatalog: true,
      });
      const dupError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "5.0.0" },
      );
      prisma.userLibrarySave.create.mockRejectedValue(dupError);
      const savedAt = new Date("2026-05-01");
      prisma.userLibrarySave.findUnique.mockResolvedValue({
        userId: "u1",
        trackId: "t1",
        savedAt,
      });

      const result = await service.save("u1", "t1");
      expect(result.savedAt).toEqual(savedAt);
    });
  });

  describe("unsave", () => {
    it("deletes a save row for a non-owned track", async () => {
      prisma.track.findUnique.mockResolvedValue({ userId: "owner" });
      await service.unsave("u1", "t1");
      expect(prisma.userLibrarySave.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1", trackId: "t1" },
      });
    });

    it("refuses to unsave an owned track", async () => {
      prisma.track.findUnique.mockResolvedValue({ userId: "u1" });
      await expect(service.unsave("u1", "t1")).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.userLibrarySave.deleteMany).not.toHaveBeenCalled();
    });

    it("is a silent no-op when track is gone", async () => {
      prisma.track.findUnique.mockResolvedValue(null);
      await expect(service.unsave("u1", "t1")).resolves.toBeUndefined();
    });
  });

  describe("getLatestSavedCover", () => {
    it("returns the cover of the most recent explicit save", async () => {
      prisma.userLibrarySave.findFirst.mockResolvedValue({
        trackId: "t1",
        track: { coverArt: "https://r2/cover.jpg" },
      });
      const result = await service.getLatestSavedCover("u1");
      expect(result).toEqual({
        coverArt: "https://r2/cover.jpg",
        trackId: "t1",
      });
    });

    it("falls back to the latest owned track with a cover", async () => {
      prisma.userLibrarySave.findFirst.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue({
        id: "t9",
        coverArt: "https://r2/own.jpg",
      });
      const result = await service.getLatestSavedCover("u1");
      expect(result).toEqual({
        coverArt: "https://r2/own.jpg",
        trackId: "t9",
      });
    });

    it("returns nulls when nothing is available", async () => {
      prisma.userLibrarySave.findFirst.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(null);
      const result = await service.getLatestSavedCover("u1");
      expect(result).toEqual({ coverArt: null, trackId: null });
    });
  });

  describe("getSavedTrackIds", () => {
    it("merges explicit saves and owned tracks", async () => {
      prisma.userLibrarySave.findMany.mockResolvedValue([
        { trackId: "t1" },
        { trackId: "t2" },
      ]);
      prisma.track.findMany.mockResolvedValue([{ id: "t2" }, { id: "t3" }]);
      const result = await service.getSavedTrackIds("u1", [
        "t1",
        "t2",
        "t3",
        "t4",
      ]);
      expect(result.sort()).toEqual(["t1", "t2", "t3"]);
    });

    it("short-circuits when no ids requested", async () => {
      const result = await service.getSavedTrackIds("u1", []);
      expect(result).toEqual([]);
      expect(prisma.userLibrarySave.findMany).not.toHaveBeenCalled();
    });
  });
});
