import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CatalogService, parseCatalogUploadMetadata } from "./catalog.service";

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
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    trackFeaturedArtist: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    playHistory: {
      groupBy: jest.Mock;
    };
    deletedCatalogArtist: {
      deleteMany: jest.Mock;
      upsert: jest.Mock;
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
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      trackFeaturedArtist: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      playHistory: {
        groupBy: jest.fn(),
      },
      deletedCatalogArtist: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (operation) =>
        typeof operation === "function"
          ? operation(prisma)
          : Promise.all(operation),
      ),
    };
    const storage = {
      uploadAudio: jest.fn(),
      uploadCatalogAudio: jest.fn(),
      uploadArtistImage: jest.fn(),
      uploadLyrics: jest.fn(),
      deleteLyrics: jest.fn(),
    } as unknown as import("@/modules/storage/storage.service").StorageService;
    service = new CatalogService(prisma as unknown as PrismaService, storage);
  });

  describe("parseCatalogUploadMetadata", () => {
    it("stores a featuring upload under the main artist, title and credits", () => {
      expect(
        parseCatalogUploadMetadata(
          "Sean Paul ft. Dua Lipa - No Lie",
          "Sean Paul",
        ),
      ).toEqual({
        title: "No Lie",
        featuredArtistNames: ["Dua Lipa"],
      });
    });

    it("preserves every hyphen-separated featuring credit before the title", () => {
      expect(
        parseCatalogUploadMetadata(
          "The Weeknd ft. JENNIE - Lily Rose Depp - One Of The Girls",
          "The Weeknd",
        ),
      ).toEqual({
        title: "One Of The Girls",
        featuredArtistNames: ["JENNIE", "Lily Rose Depp"],
      });
    });

    it("uses the final hyphen-separated part as the title for any number of collaborators", () => {
      expect(
        parseCatalogUploadMetadata(
          "Fernando Mas ft. Dua Lipa - Katy Perry - Hora de Amar",
          "Fernando Mas",
        ),
      ).toEqual({
        title: "Hora de Amar",
        featuredArtistNames: ["Dua Lipa", "Katy Perry"],
      });
    });

    it("matches every selected artist by normalized identity, not a hard-coded name", () => {
      expect(
        parseCatalogUploadMetadata(
          "50Cent FEAT. The Game - Hate It Or Love It",
          "50 Cent",
        ),
      ).toEqual({
        title: "Hate It Or Love It",
        featuredArtistNames: ["The Game"],
      });
    });

    it("removes only the selected artist prefix from a regular upload", () => {
      expect(parseCatalogUploadMetadata("50Cent - Wanksta", "50Cent")).toEqual({
        title: "Wanksta",
        featuredArtistNames: [],
      });
    });
  });

  describe("uploadArtistImageFromCloudflare", () => {
    it("links an existing R2 URL without uploading a duplicate image", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "artist-1" });
      prisma.artist.update.mockReturnValue("artist-update");
      prisma.track.updateMany.mockReturnValue("tracks-update");
      prisma.$transaction.mockResolvedValue([]);

      await expect(
        service.uploadArtistImageFromCloudflare(
          "artist-1",
          "https://images.example.r2.dev/The%20Black%20Eyed%20Peas.webp",
        ),
      ).resolves.toEqual({
        imageUrl:
          "https://images.example.r2.dev/The%20Black%20Eyed%20Peas.webp",
      });

      expect(prisma.$transaction).toHaveBeenCalledWith([
        "artist-update",
        "tracks-update",
      ]);
      expect(
        (
          service as unknown as {
            storage: { uploadArtistImage: jest.Mock };
          }
        ).storage.uploadArtistImage,
      ).not.toHaveBeenCalled();
    });
  });

  describe("removeArtistImage", () => {
    it("clears the artist and catalog-track image references without deleting R2", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "artist-1" });
      prisma.artist.update.mockReturnValue("artist-update");
      prisma.track.updateMany.mockReturnValue("tracks-update");
      prisma.$transaction.mockResolvedValue([]);

      await expect(service.removeArtistImage("artist-1")).resolves.toEqual({
        imageUrl: null,
      });

      expect(prisma.$transaction).toHaveBeenCalledWith([
        "artist-update",
        "tracks-update",
      ]);
      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: "artist-1" },
        data: { imageUrl: null },
      });
      expect(prisma.track.updateMany).toHaveBeenCalledWith({
        where: { artistId: "artist-1" },
        data: { artistImage: null },
      });
    });
  });

  describe("uploadCatalogTrack", () => {
    it("writes the canonical R2 key without repeating the primary artist", async () => {
      const storage = (
        service as unknown as {
          storage: { uploadCatalogAudio: jest.Mock };
        }
      ).storage;
      storage.uploadCatalogAudio.mockResolvedValue({
        url: "https://audio.example/Sean%20Paul%20-%20When%20You%20Gonna%20Give%20It%20UpTo%20Me%20(feat.%20Keyshia%20Cole).wav",
      });
      prisma.track.findUnique.mockResolvedValue(null);
      prisma.artist.findUnique.mockResolvedValue({
        id: "sean-paul",
        name: "Sean Paul",
        imageUrl: null,
      });
      prisma.track.create.mockResolvedValue({
        id: "track-1",
        title: "When You Gonna Give It UpTo Me",
      });
      prisma.artist.findMany.mockResolvedValue([]);
      prisma.trackFeaturedArtist.deleteMany.mockReturnValue("remove-credits");
      prisma.trackFeaturedArtist.createMany.mockReturnValue("add-credits");
      prisma.$transaction.mockResolvedValue([]);

      await service.uploadCatalogTrack(
        "admin-1",
        {
          buffer: Buffer.from("wav"),
          mimetype: "audio/wav",
          originalname:
            "Sean Paul ft. Keyshia Cole - When You Gonna Give It UpTo Me.wav",
          size: 3,
        } as Express.Multer.File,
        { artistId: "sean-paul" },
      );

      expect(storage.uploadCatalogAudio).toHaveBeenCalledWith(
        expect.anything(),
        "Sean Paul",
        "When You Gonna Give It UpTo Me (feat. Keyshia Cole)",
      );
      expect(prisma.track.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artist: "Sean Paul",
            title: "When You Gonna Give It UpTo Me",
          }),
        }),
      );
      expect(prisma.trackFeaturedArtist.createMany).toHaveBeenCalledWith({
        data: [
          {
            trackId: "track-1",
            artistName: "Keyshia Cole",
            artistId: null,
            position: 0,
          },
        ],
      });
    });
  });

  describe("updateCatalogTrack", () => {
    it("links an existing R2 WAV URL without copying it", async () => {
      prisma.track.findFirst.mockResolvedValue({ id: "track-1" });
      prisma.track.update.mockResolvedValue({ id: "track-1" });

      await service.updateCatalogTrack("track-1", {
        fileUrlRemote: "https://music-flow.r2.dev/Artist%20-%20Song.wav",
      });

      expect(prisma.track.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "track-1" },
          data: expect.objectContaining({
            fileUrlRemote: "https://music-flow.r2.dev/Artist%20-%20Song.wav",
          }),
        }),
      );
    });

    it("rejects a non-R2 or non-lossless audio URL", async () => {
      prisma.track.findFirst.mockResolvedValue({ id: "track-1" });

      await expect(
        service.updateCatalogTrack("track-1", {
          fileUrlRemote: "https://example.com/song.mp3",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
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

  describe("listTrendingTracks", () => {
    it("ranks songs by recent acceleration, not their lifetime volume", async () => {
      prisma.playHistory.groupBy
        .mockResolvedValueOnce([
          { trackId: "surging", _count: { trackId: 8 } },
          { trackId: "steady", _count: { trackId: 12 } },
        ])
        .mockResolvedValueOnce([
          { trackId: "surging", _count: { trackId: 1 } },
          { trackId: "steady", _count: { trackId: 30 } },
        ]);
      prisma.track.findMany.mockResolvedValue([
        { id: "steady", title: "Steady" },
        { id: "surging", title: "Surging" },
      ]);

      const result = await service.listTrendingTracks(2);

      expect(result.map((track) => track.id)).toEqual(["surging", "steady"]);
      expect(prisma.playHistory.groupBy).toHaveBeenCalledTimes(2);
      expect(prisma.track.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isCatalog: true,
            fileUrlRemote: { not: null },
          }),
        }),
      );
    });
  });

  describe("listFeaturedTracks", () => {
    it("ranks all-time plays while giving each artist one carousel spot first", async () => {
      prisma.playHistory.groupBy.mockResolvedValue([
        { trackId: "a1", _count: { trackId: 100 } },
        { trackId: "a2", _count: { trackId: 90 } },
        { trackId: "b1", _count: { trackId: 80 } },
        { trackId: "c1", _count: { trackId: 70 } },
      ]);
      prisma.track.findMany.mockResolvedValue([
        { id: "a1", artist: "Artist A", artistId: "artist-a" },
        { id: "a2", artist: "Artist A", artistId: "artist-a" },
        { id: "b1", artist: "Artist B", artistId: "artist-b" },
        { id: "c1", artist: "Artist C", artistId: "artist-c" },
      ]);

      const result = await service.listFeaturedTracks("popular", 3);

      expect(result.mode).toBe("popular");
      expect(result.tracks.map((track) => track.id)).toEqual([
        "a1",
        "b1",
        "c1",
      ]);
      expect(prisma.playHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 250 }),
      );
    });

    it("falls back to newest catalog tracks when nobody has played one yet", async () => {
      prisma.playHistory.groupBy.mockResolvedValue([]);
      prisma.track.findMany.mockResolvedValue([
        { id: "new", artist: "New Artist", artistId: "new-artist" },
      ]);

      const result = await service.listFeaturedTracks("popular", 3);

      expect(result.mode).toBe("recent");
      expect(result.tracks.map((track) => track.id)).toEqual(["new"]);
      expect(prisma.track.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
      );
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
        followers: [],
        _count: { followers: 0 },
        albums: [
          {
            id: "al1",
            title: "Jazz",
            coverArt: "c",
            year: 1978,
            _count: { tracks: 3 },
          },
        ],
        tracks: [{ id: "t1", title: "Bicycle Race", artist: "Queen" }],
      });
      const result = await service.getArtist("a1", "u1");
      expect(result.albums).toEqual([
        { id: "al1", title: "Jazz", coverArt: "c", year: 1978, trackCount: 3 },
      ]);
      expect(result.bio).toBe("the band");
      expect(result.tracks).toHaveLength(1);
    });

    it("throws NotFound when the artist is missing", async () => {
      prisma.artist.findUnique.mockResolvedValue(null);
      await expect(service.getArtist("ghost", "u1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("includes tracks linked through an album even when a legacy row lacks artistId", async () => {
      const albumTrack = {
        id: "legacy-track",
        title: "Missing direct relation",
        album: "Jazz",
        albumOrder: 1,
      };
      prisma.artist.findUnique.mockResolvedValue({
        id: "a1",
        name: "Queen",
        slug: "queen",
        imageUrl: "u",
        bio: null,
        followers: [],
        _count: { followers: 0 },
        albums: [
          {
            id: "al1",
            title: "Jazz",
            coverArt: "c",
            year: 1978,
            tracks: [albumTrack],
            _count: { tracks: 1 },
          },
        ],
        tracks: [],
      });

      const result = await service.getArtist("a1", "u1");

      expect(result.tracks).toEqual([albumTrack]);
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
    it("rejects a featuring string instead of creating a composite profile", async () => {
      await expect(
        service.createArtist({ name: "Sean Paul ft. Dua Lipa" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.artist.create).not.toHaveBeenCalled();
    });

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
          normalizedName: "manapop",
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
      expect(prisma.artist.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { normalizedName: "queen", id: { not: "a1" } },
        }),
      );
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

    it("keeps the existing artist profile and its tracks when renamed", async () => {
      prisma.artist.findUnique.mockResolvedValue({ id: "a1", name: "Maroon5" });
      prisma.artist.findFirst.mockResolvedValue(null);
      prisma.artist.update.mockResolvedValue({ id: "a1", name: "Maroon 5" });

      await service.updateArtist("a1", { name: "Maroon 5" });

      expect(prisma.track.updateMany).toHaveBeenCalledWith({
        where: { artistId: "a1" },
        data: { artist: "Maroon 5" },
      });
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
        .mockResolvedValueOnce({
          id: "al1",
          title: "Jazz",
          artistId: "a1",
          coverArt: "jazz-cover",
        }) // existence check
        .mockResolvedValueOnce({ id: "al1", tracks: [], artist: {} }); // getAlbum
      prisma.$transaction.mockResolvedValue([]);
      prisma.track.updateMany.mockReturnValue("detach-op");
      prisma.track.update.mockImplementation((arg) => arg);

      await service.reorderAlbum("al1", { trackIds: ["t1", "t2"] });

      // Detach query excludes the kept ids.
      expect(prisma.track.updateMany).toHaveBeenCalledWith({
        where: { albumId: "al1", id: { notIn: ["t1", "t2"] } },
        data: { albumId: null, albumOrder: null, album: "", coverArt: null },
      });
      // Each kept track is renumbered 1..n and re-linked to the artist.
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: {
          albumId: "al1",
          albumOrder: 1,
          artistId: "a1",
          album: "Jazz",
          coverArt: "jazz-cover",
        },
      });
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t2" },
        data: {
          albumId: "al1",
          albumOrder: 2,
          artistId: "a1",
          album: "Jazz",
          coverArt: "jazz-cover",
        },
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
      prisma.track.findUniqueOrThrow.mockResolvedValue({});

      await service.assignTrack("t1", { albumId: null });
      expect(prisma.track.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            albumId: null,
            album: "",
            coverArt: null,
          }),
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

    it("always inherits the assigned album cover", async () => {
      prisma.track.findUnique.mockResolvedValue({ id: "t1" });
      prisma.album.findUnique.mockResolvedValue({
        id: "al1",
        title: "Jazz",
        artistId: "a1",
        coverArt: "album-cover",
      });
      prisma.track.update.mockResolvedValue({});
      prisma.track.findUniqueOrThrow.mockResolvedValue({ id: "t1" });

      await service.assignTrack("t1", {
        albumId: "al1",
      });

      expect(prisma.track.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artistId: "a1",
            albumId: "al1",
            album: "Jazz",
            coverArt: "album-cover",
          }),
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
      prisma.track.findUnique.mockResolvedValue({
        id: "t1",
        title: "Window Shopper",
        artist: "50 Cent",
        artistRef: { name: "50 Cent" },
      });
      prisma.track.update.mockResolvedValue({});
      const result = await service.updateLyrics("t1", {
        lyricsText: "secret words",
      });
      expect(result).toEqual({ updated: true, hasLrc: false, hasText: true });
      expect(JSON.stringify(result)).not.toContain("secret words");
      expect(
        (
          service as unknown as {
            storage: { uploadLyrics: jest.Mock };
          }
        ).storage.uploadLyrics,
      ).toHaveBeenCalledWith("50 Cent", "Window Shopper", "secret words");
    });

    it("links an existing Cloudflare LRC without downloading or duplicating it", async () => {
      prisma.track.findUnique.mockResolvedValue({
        id: "t1",
        title: "Window Shopper",
        artist: "50 Cent",
        artistRef: { name: "50 Cent" },
      });
      prisma.track.update.mockResolvedValue({});
      const result = await service.updateLyrics("t1", {
        lyricsUrl:
          "https://lyrics.example.r2.dev/50%20Cent%20-%20Window%20Shopper.lrc",
      });

      expect(result).toEqual({
        updated: true,
        hasLrc: true,
        hasText: false,
        lyricsUrl:
          "https://lyrics.example.r2.dev/50%20Cent%20-%20Window%20Shopper.lrc",
      });
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: {
          lyricsUrl:
            "https://lyrics.example.r2.dev/50%20Cent%20-%20Window%20Shopper.lrc",
          lyricsLrc: null,
          lyricsText: null,
        },
      });
      expect(
        (
          service as unknown as {
            storage: { uploadLyrics: jest.Mock };
          }
        ).storage.uploadLyrics,
      ).not.toHaveBeenCalled();
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
