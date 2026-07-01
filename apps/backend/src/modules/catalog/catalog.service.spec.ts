import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CatalogService } from "./catalog.service";

describe("CatalogService", () => {
  let service: CatalogService;
  let prisma: {
    artist: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    album: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    track: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      artist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      album: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      track: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const storage = {
      uploadAudio: jest.fn(),
    } as unknown as import("@/modules/storage/storage.service").StorageService;
    service = new CatalogService(prisma as unknown as PrismaService, storage);
  });

  describe("listArtists", () => {
    it("flattens the _count relation into albumCount/trackCount", async () => {
      prisma.artist.findMany.mockResolvedValue([
        {
          id: "a1",
          name: "Queen",
          slug: "queen",
          imageUrl: "u",
          _count: { albums: 4, tracks: 12 },
        },
      ]);
      const result = await service.listArtists();
      expect(result).toEqual([
        {
          id: "a1",
          name: "Queen",
          slug: "queen",
          imageUrl: "u",
          albumCount: 4,
          trackCount: 12,
        },
      ]);
    });
  });

  describe("getArtist", () => {
    it("maps albums/tracks and includes bio", async () => {
      prisma.artist.findUnique.mockResolvedValue({
        id: "a1",
        name: "Queen",
        slug: "queen",
        imageUrl: "u",
        bio: "the band",
        albums: [
          {
            id: "al1",
            title: "Jazz",
            coverArt: "c",
            year: 1978,
            _count: { tracks: 3 },
          },
        ],
        tracks: [{ id: "t1", title: "Bicycle Race" }],
      });
      const result = await service.getArtist("a1");
      expect(result.albums).toEqual([
        { id: "al1", title: "Jazz", coverArt: "c", year: 1978, trackCount: 3 },
      ]);
      expect(result.bio).toBe("the band");
      expect(result.tracks).toHaveLength(1);
    });

    it("throws NotFound when the artist is missing", async () => {
      prisma.artist.findUnique.mockResolvedValue(null);
      await expect(service.getArtist("ghost")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getAlbum", () => {
    it("returns the album as-is when found", async () => {
      const album = { id: "al1", title: "Jazz", tracks: [], artist: {} };
      prisma.album.findUnique.mockResolvedValue(album);
      await expect(service.getAlbum("al1")).resolves.toBe(album);
    });

    it("throws NotFound when missing", async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      await expect(service.getAlbum("ghost")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("createArtist", () => {
    it("slugifies the name (accents stripped, spaces hyphenated)", async () => {
      prisma.artist.findFirst.mockResolvedValue(null); // no slug clash
      prisma.artist.create.mockImplementation(({ data }) => ({
        id: "a1",
        ...data,
      }));
      await service.createArtist({ name: "Maná Pop" });
      expect(prisma.artist.create).toHaveBeenCalledWith({
        data: {
          name: "Maná Pop",
          slug: "mana-pop",
          imageUrl: null,
          bio: null,
          genres: [],
        },
      });
    });

    it("disambiguates a colliding slug with a numeric suffix", async () => {
      // First probe finds a clash, second is free.
      prisma.artist.findFirst
        .mockResolvedValueOnce({ id: "other" })
        .mockResolvedValueOnce(null);
      prisma.artist.create.mockImplementation(({ data }) => data);
      await service.createArtist({ name: "Queen" });
      expect(prisma.artist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: "queen-2" }),
        }),
      );
    });

    it("normalizes genres: trims, drops empties, de-dupes (case-insensitive)", async () => {
      prisma.artist.findFirst.mockResolvedValue(null);
      prisma.artist.create.mockImplementation(({ data }) => data);
      await service.createArtist({
        name: "X",
        genres: [" Rock ", "rock", "", "Pop", "POP"],
      });
      expect(prisma.artist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ genres: ["Rock", "Pop"] }),
        }),
      );
    });
  });

  describe("updateArtist genres", () => {
    it("only re-writes genres when the payload includes them", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "a1", name: "X" });
      prisma.artist.update.mockResolvedValue({});
      // No genres key → must stay undefined (Prisma leaves the column alone).
      await service.updateArtist("a1", { bio: "hi" });
      expect(prisma.artist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ genres: undefined }),
        }),
      );
      prisma.artist.update.mockClear();
      await service.updateArtist("a1", { genres: ["Jazz", "jazz"] });
      expect(prisma.artist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ genres: ["Jazz"] }),
        }),
      );
    });
  });

  describe("updateArtist", () => {
    it("throws NotFound when the artist does not exist", async () => {
      prisma.artist.findUnique.mockResolvedValue(null);
      await expect(
        service.updateArtist("ghost", { name: "X" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("does not regenerate the slug when the name is unchanged", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "a1", name: "Queen" });
      prisma.artist.update.mockResolvedValue({});
      await service.updateArtist("a1", { name: "Queen", bio: "x" });
      // uniqueSlug probes via findFirst — should never be called here.
      expect(prisma.artist.findFirst).not.toHaveBeenCalled();
      expect(prisma.artist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: undefined }),
        }),
      );
    });

    it("regenerates the slug when the name changes", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "a1", name: "Queen" });
      prisma.artist.findFirst.mockResolvedValue(null);
      prisma.artist.update.mockResolvedValue({});
      await service.updateArtist("a1", { name: "The Beatles" });
      expect(prisma.artist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: "the-beatles" }),
        }),
      );
    });
  });

  describe("createAlbum", () => {
    it("rejects when artistId does not exist", async () => {
      prisma.artist.findUnique.mockResolvedValue(null);
      await expect(
        service.createAlbum({ title: "X", artistId: "ghost" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.album.create).not.toHaveBeenCalled();
    });

    it("creates the album when the artist exists", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "a1" });
      prisma.album.create.mockResolvedValue({ id: "al1" });
      await service.createAlbum({ title: "Jazz", artistId: "a1", year: 1978 });
      expect(prisma.album.create).toHaveBeenCalledWith({
        data: { title: "Jazz", artistId: "a1", coverArt: null, year: 1978 },
      });
    });
  });

  describe("updateAlbum", () => {
    it("throws NotFound when the album is missing", async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      await expect(
        service.updateAlbum("ghost", { title: "X" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("reorderAlbum", () => {
    it("throws NotFound when the album is missing", async () => {
      prisma.album.findUnique.mockResolvedValue(null);
      await expect(
        service.reorderAlbum("ghost", { trackIds: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("detaches removed tracks and renumbers the rest in a transaction", async () => {
      prisma.album.findUnique
        .mockResolvedValueOnce({ id: "al1", artistId: "a1" }) // existence check
        .mockResolvedValueOnce({ id: "al1", tracks: [], artist: {} }); // getAlbum
      prisma.$transaction.mockResolvedValue([]);
      prisma.track.updateMany.mockReturnValue("detach-op");
      prisma.track.update.mockImplementation((arg) => arg);

      await service.reorderAlbum("al1", { trackIds: ["t1", "t2"] });

      // Detach query excludes the kept ids.
      expect(prisma.track.updateMany).toHaveBeenCalledWith({
        where: { albumId: "al1", id: { notIn: ["t1", "t2"] } },
        data: { albumId: null, albumOrder: null },
      });
      // Each kept track is renumbered 1..n and re-linked to the artist.
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { albumId: "al1", albumOrder: 1, artistId: "a1" },
      });
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t2" },
        data: { albumId: "al1", albumOrder: 2, artistId: "a1" },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("assignTrack", () => {
    it("throws NotFound when the track is missing", async () => {
      prisma.track.findUnique.mockResolvedValue(null);
      await expect(
        service.assignTrack("ghost", { albumId: "al1" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("passes null albumId through to unassign, but undefined leaves it untouched", async () => {
      prisma.track.findUnique.mockResolvedValue({ id: "t1" });
      prisma.track.update.mockResolvedValue({});

      await service.assignTrack("t1", { albumId: null });
      expect(prisma.track.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ albumId: null }),
        }),
      );

      prisma.track.update.mockClear();
      await service.assignTrack("t1", { albumOrder: 3 });
      expect(prisma.track.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ albumId: undefined, albumOrder: 3 }),
        }),
      );
    });
  });

  describe("updateLyrics", () => {
    it("throws NotFound when the track is missing", async () => {
      prisma.track.findUnique.mockResolvedValue(null);
      await expect(
        service.updateLyrics("ghost", { lyricsLrc: "[00:01]" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns only flags and never echoes the lyrics content", async () => {
      prisma.track.findUnique.mockResolvedValue({ id: "t1" });
      prisma.track.update.mockResolvedValue({});
      const result = await service.updateLyrics("t1", {
        lyricsText: "secret words",
      });
      expect(result).toEqual({ updated: true, hasLrc: false, hasText: true });
      expect(JSON.stringify(result)).not.toContain("secret words");
    });
  });

  describe("unassignedTracks", () => {
    it("filters to catalog tracks with no album, optionally by artist", async () => {
      prisma.track.findMany.mockResolvedValue([{ id: "t1" }]);
      await service.unassignedTracks("a1");
      expect(prisma.track.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isCatalog: true, albumId: null, artistId: "a1" },
        }),
      );
    });

    it("omits the artist filter when no artistId is given", async () => {
      prisma.track.findMany.mockResolvedValue([]);
      await service.unassignedTracks();
      expect(prisma.track.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isCatalog: true, albumId: null },
        }),
      );
    });
  });
});
