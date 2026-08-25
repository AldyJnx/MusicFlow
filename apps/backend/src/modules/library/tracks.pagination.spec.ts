import { TracksService } from "./tracks.service";

describe("TracksService paginated catalog views", () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };
  const storage = {};
  let service: TracksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TracksService(prisma as never, storage as never);
  });

  it("returns six artists and exposes the next offset", async () => {
    prisma.$queryRaw.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        name: `Artist ${index + 1}`,
        imageUrl: null,
        total: 13,
      })),
    );

    await expect(
      service.getArtistsPage("user-1", { offset: 0, limit: 6 }),
    ).resolves.toEqual({
      items: Array.from({ length: 6 }, (_, index) => ({
        name: `Artist ${index + 1}`,
        imageUrl: null,
      })),
      total: 13,
      nextOffset: 6,
    });
  });

  it("marks the last album page and removes the internal total field", async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        album: "Album 13",
        albumArtist: "Artist",
        coverArt: "https://images.test/album.jpg",
        total: 13,
      },
    ]);

    await expect(
      service.getAlbumsPage("user-1", {
        query: " album ",
        offset: 12,
        limit: 6,
      }),
    ).resolves.toEqual({
      items: [
        {
          album: "Album 13",
          albumArtist: "Artist",
          coverArt: "https://images.test/album.jpg",
        },
      ],
      total: 13,
      nextOffset: null,
    });
  });

  it("returns an empty page without inventing a next offset", async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(
      service.getArtistsPage("user-1", { offset: -4, limit: 100 }),
    ).resolves.toEqual({ items: [], total: 0, nextOffset: null });
  });
});
