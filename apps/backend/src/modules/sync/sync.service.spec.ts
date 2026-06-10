import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SyncService } from "./sync.service";

describe("SyncService — conflict resolution", () => {
  let service: SyncService;
  let prisma: {
    conflictLog: { findFirst: jest.Mock; update: jest.Mock };
    track: { update: jest.Mock };
    playlist: { update: jest.Mock };
    eQConfig: { update: jest.Mock };
    eQSegment: { update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      conflictLog: { findFirst: jest.fn(), update: jest.fn() },
      track: { update: jest.fn() },
      playlist: { update: jest.fn() },
      eQConfig: { update: jest.fn() },
      eQSegment: { update: jest.fn() },
    };
    service = new SyncService(prisma as unknown as PrismaService);
  });

  function mockConflict(overrides: Record<string, unknown> = {}) {
    const conflict = {
      id: "c1",
      userId: "u1",
      entityType: "track",
      entityId: "t1",
      localVersion: {},
      serverVersion: {},
      resolved: false,
      ...overrides,
    };
    prisma.conflictLog.findFirst.mockResolvedValue(conflict);
    prisma.conflictLog.update.mockResolvedValue({
      ...conflict,
      resolved: true,
    });
    return conflict;
  }

  it("throws NotFound when the conflict does not exist", async () => {
    prisma.conflictLog.findFirst.mockResolvedValue(null);
    await expect(
      service.resolveConflict("missing", "u1", "MERGE"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  describe("MERGE", () => {
    it("overlays local fields on the server base, preserving server-only edits", async () => {
      mockConflict({
        entityType: "track",
        entityId: "t1",
        localVersion: { title: "Local Title", genre: "Rock" },
        serverVersion: {
          title: "Server Title",
          artist: "Server Artist",
          album: "Server Album",
        },
      });

      await service.resolveConflict("c1", "u1", "MERGE");

      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: {
          title: "Local Title", // local wins on a conflicting field
          genre: "Rock", // local-only field added
          artist: "Server Artist", // server-only field preserved
          album: "Server Album",
        },
      });
    });

    it("never lets the snapshot reassign identity/ownership/timestamps", async () => {
      mockConflict({
        localVersion: {
          id: "spoofed",
          userId: "attacker",
          createdAt: "2020-01-01",
          updatedAt: "2020-01-01",
          title: "New",
        },
        serverVersion: { id: "t1", userId: "u1", title: "Old" },
      });

      await service.resolveConflict("c1", "u1", "MERGE");

      const data = prisma.track.update.mock.calls[0][0].data;
      expect(data).toEqual({ title: "New" });
      expect(data).not.toHaveProperty("id");
      expect(data).not.toHaveProperty("userId");
      expect(data).not.toHaveProperty("updatedAt");
    });

    it("ignores null/undefined local fields so they don't clobber the server", async () => {
      mockConflict({
        localVersion: { title: "Kept", album: null, genre: undefined },
        serverVersion: { title: "Old", album: "Server Album" },
      });

      await service.resolveConflict("c1", "u1", "MERGE");

      expect(prisma.track.update.mock.calls[0][0].data).toEqual({
        title: "Kept",
        album: "Server Album",
      });
    });

    it("strips relational arrays that aren't scalar columns", async () => {
      mockConflict({
        entityType: "playlist",
        localVersion: { name: "Mix", tracks: [{ trackId: "x" }] },
        serverVersion: { name: "Old", description: "desc" },
      });

      await service.resolveConflict("c1", "u1", "MERGE");

      expect(prisma.playlist.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { name: "Mix", description: "desc" },
      });
    });

    it("routes eqConfig conflicts to the eqConfig table", async () => {
      mockConflict({
        entityType: "eqConfig",
        entityId: "cfg1",
        localVersion: { bassBoost: 6 },
        serverVersion: { bassBoost: 0, loudness: 2 },
      });

      await service.resolveConflict("c1", "u1", "MERGE");

      expect(prisma.eQConfig.update).toHaveBeenCalledWith({
        where: { id: "cfg1" },
        data: { bassBoost: 6, loudness: 2 },
      });
    });
  });

  describe("LOCAL_WINS / SERVER_WINS", () => {
    it("LOCAL_WINS writes the whole local snapshot", async () => {
      mockConflict({
        localVersion: { title: "Local" },
        serverVersion: { title: "Server" },
      });

      await service.resolveConflict("c1", "u1", "LOCAL_WINS");

      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { title: "Local" },
      });
    });

    it("SERVER_WINS does not touch the entity table", async () => {
      mockConflict({
        localVersion: { title: "Local" },
        serverVersion: { title: "Server" },
      });

      await service.resolveConflict("c1", "u1", "SERVER_WINS");

      expect(prisma.track.update).not.toHaveBeenCalled();
    });
  });

  it("marks the conflict resolved with the chosen resolution", async () => {
    mockConflict();
    await service.resolveConflict("c1", "u1", "SERVER_WINS");
    expect(prisma.conflictLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({
          resolved: true,
          resolution: "SERVER_WINS",
        }),
      }),
    );
  });
});
