import { expect, test, type Page } from "@playwright/test";

const track = {
  id: "song-1",
  userId: "user-1",
  title: "Smoke Test",
  artist: "Test Artist",
  album: "Test Album",
  albumArtist: null,
  genre: "Pop",
  year: 2026,
  durationMs: 210_000,
  coverArt: null,
  artistImage: null,
  fileUrlRemote: "https://media.musicflow.test/smoke-test.mp3",
  isCatalog: true,
  source: "SYNCED",
  syncStatus: "SYNCED",
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
};

const trendingTrack = {
  ...track,
  id: "song-2",
  title: "Trending Smoke Test",
};

async function mockAuthenticatedApi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("musicflow-lang", "es");
    localStorage.setItem(
      "musicflow-auth",
      JSON.stringify({
        state: {
          user: {
            id: "user-1",
            email: "listener@example.test",
            username: "Listener",
            role: "CLIENT",
            isPremium: false,
            avatar: null,
          },
          accessToken: "test-token",
          refreshToken: "test-refresh",
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  });

  await page.route(/https?:\/\/(?:localhost|127\.0\.0\.1):8000\/api\/.*/, async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];

    if (path === "/api/library/tracks") {
      body = { tracks: [track], total: 1, skip: 0, take: 20 };
    } else if (path === "/api/catalog/trending") {
      body = [track, trendingTrack];
    } else if (path === "/api/library/tracks/artists/page") {
      body = {
        items: [{ name: "Test Artist", imageUrl: null }],
        total: 1,
        nextOffset: null,
      };
    } else if (path === "/api/library/tracks/albums/page") {
      body = {
        items: [
          {
            album: "Test Album",
            albumArtist: "Test Artist",
            coverArt: null,
          },
        ],
        total: 1,
        nextOffset: null,
      };
    } else if (path === "/api/library/tracks/artists") {
      body = [{ name: "Test Artist", imageUrl: null }];
    } else if (path === "/api/recommendations/home") {
      body = {
        tracks: [{ ...track, recommendationReason: "Artista que sigues" }],
        generatedAt: "2026-08-17T00:00:00.000Z",
      };
    } else if (path === "/api/catalog/albums/recent") {
      body = [
        {
          id: "album-1",
          title: "Test Album",
          coverArt: null,
          year: 2026,
          createdAt: "2026-08-17T00:00:00.000Z",
          artist: { id: "artist-1", name: "Test Artist", imageUrl: null },
          trackCount: 1,
          tracks: [track],
        },
      ];
    } else if (path === "/api/catalog/artists/page") {
      body = {
        items: [
          {
            id: "artist-bruno",
            name: "Bruno Mars",
            slug: "bruno-mars",
            imageUrl: null,
            genres: ["Pop"],
            albumCount: 1,
            trackCount: 4,
          },
        ],
        total: 1,
        nextOffset: null,
      };
    } else if (path === "/api/library/tracks/song-1/lyrics") {
      body = {
        trackId: "song-1",
        lrc: [
          "[00:00.00] Primera linea",
          "[00:20.00] Segunda linea",
          "[00:40.00] Tercera linea",
          "[01:00.00] Cuarta linea",
          "[01:20.00] Quinta linea",
          "[01:40.00] Sexta linea",
        ].join("\n"),
        text: null,
        hasLyrics: true,
      };
    } else if (path === "/api/analytics/stats") {
      body = {
        totalPlays: 4,
        totalTimeMs: "240000",
        uniqueTracks: 1,
        uniqueArtists: 1,
        topTracks: [],
        topArtists: [],
        topAlbums: [],
      };
    } else if (path === "/api/analytics/recently-played") {
      body = [];
    } else if (path === "/api/billing/quota") {
      body = {
        isPremium: false,
        uploads: { used: 0, limit: 5, remaining: 5 },
        aiRequests: { used: 0, limit: 10, remaining: 10 },
        customPresets: { used: 0, limit: 3, remaining: 3 },
      };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.route("https://media.musicflow.test/**", (route) =>
    route.fulfill({ status: 204 }),
  );
}

test("lyrics keep the route behind the expanded player stationary", async ({
  page,
}) => {
  await mockAuthenticatedApi(page);
  await page.goto("/inicio");

  // The responsive hero overlaps its own visual layers on Pixel 7. Dispatch
  // the setup action directly; the assertions below cover player behavior.
  await page
    .getByRole("button", { name: /^(Reproducir|Play)$/ })
    .dispatchEvent("click");
  await page
    .getByTitle(/^(Abrir|Expandir) reproductor$|^Expand player$/)
    .last()
    .dispatchEvent("click");
  await page.getByRole("button", { name: /^(Letra|Lyrics)$/ }).click();

  const lyrics = page.locator("div.overscroll-contain").last();
  await expect(lyrics).toBeVisible();
  await expect(page.getByTestId("lyrics-glow-line")).toBeVisible();
  await expect(page.locator(".animate-bounce")).toHaveCount(0);
  const before = await page.evaluate(
    () => document.documentElement.scrollTop || document.body.scrollTop,
  );
  await lyrics.hover();
  await page.mouse.wheel(0, 700);
  const after = await page.evaluate(
    () => document.documentElement.scrollTop || document.body.scrollTop,
  );

  expect(after).toBe(before);
});

test("global search exposes artist profiles and profile has a local avatar", async ({
  page,
}) => {
  await mockAuthenticatedApi(page);
  await page.goto("/inicio");

  await page.locator("header input[type='text']").fill("Bruno");
  await page.getByRole("button", { name: /Bruno Mars/i }).click();
  await expect(page).toHaveURL(/\/artist\/Bruno%20Mars$/);

  await page.goto("/profile");
  await expect(page.getByLabel("Avatar de usuario")).toBeVisible();
});

test("home trends rotate every four seconds with aligned controls", async ({
  page,
}) => {
  await mockAuthenticatedApi(page);
  await page.goto("/inicio");

  const previous = page.getByTestId("home-hero-previous");
  const next = page.getByTestId("home-hero-next");
  const [previousBox, nextBox] = await Promise.all([
    previous.boundingBox(),
    next.boundingBox(),
  ]);
  expect(previousBox).not.toBeNull();
  expect(nextBox).not.toBeNull();
  expect(Math.abs(previousBox!.y - nextBox!.y)).toBeLessThanOrEqual(1);

  await expect(page.getByTestId("home-hero-title")).toHaveText("Smoke Test");
  await expect(page.getByTestId("home-hero-title")).toHaveText(
    "Trending Smoke Test",
    { timeout: 5_000 },
  );
});

test("library artist cards navigate and player transport controls remain available", async ({
  page,
}) => {
  await mockAuthenticatedApi(page);
  await page.goto("/library?tab=artists");

  await page.getByTestId("library-artist-Test Artist").click();
  await expect(page).toHaveURL(/\/artist\/Test%20Artist$/);

  await page.goto("/library?tab=albums");
  await expect(page.getByRole("button", { name: "Página siguiente" })).toHaveCount(0);

  await page.goto("/inicio");
  await page
    .getByRole("button", { name: /^(Reproducir|Play)$/ })
    .dispatchEvent("click");
  await expect(page.getByTestId("google-cast-button").last()).toBeVisible();
  await page.getByTitle(/^(Abrir|Expandir) reproductor$|^Expand player$/)
    .last()
    .dispatchEvent("click");
  await expect(page.getByTestId("google-cast-button").last()).toBeVisible();

  const volumeControl = page.getByTestId("expanded-volume-control");
  await volumeControl.hover();
  await expect(page.getByTestId("expanded-volume-slider")).toBeVisible();
  await page.getByText("REPRODUCIENDO").click();
  await expect(page.getByTestId("expanded-volume-slider")).toHaveCount(0);

  const shuffle = page.getByTitle(/^(Aleatorio|Shuffle)$/).last();
  await shuffle.click();
  await expect(shuffle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("aside")).toHaveCSS("position", "fixed");
  if (test.info().project.name === "chromium") {
    await expect(page.getByTestId("right-panel")).toHaveCSS(
      "position",
      "fixed",
    );
  }
});
