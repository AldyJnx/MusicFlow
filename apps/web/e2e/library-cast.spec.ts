import { expect, test, type Page } from "@playwright/test";

const track = {
  id: "song-cast",
  userId: "user-1",
  title: "Cast Test",
  artist: "Remote Artist",
  album: "Remote Album",
  albumArtist: "Remote Artist",
  genre: "Pop",
  year: 2026,
  durationMs: 180_000,
  coverArt: "https://media.musicflow.test/cover.jpg",
  artistImage: null,
  fileUrlRemote: "https://media.musicflow.test/cast-test.wav",
  isCatalog: true,
  source: "SYNCED",
  syncStatus: "SYNCED",
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
};

async function mockSession(page: Page) {
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
            isPremium: true,
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

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body: unknown = [];

    if (path === "/api/library/tracks") {
      body = { tracks: [track], total: 1, skip: 0, take: 100 };
    } else if (path === "/api/library/tracks/albums/page") {
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const items = Array.from({ length: offset === 0 ? 6 : 2 }, (_, index) => {
        const number = offset + index + 1;
        return {
          album: `Album ${number}`,
          albumArtist: `Artist ${number}`,
          coverArt: null,
        };
      });
      body = { items, total: 8, nextOffset: offset === 0 ? 6 : null };
    } else if (path === "/api/library/tracks/artists/page") {
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const items = Array.from({ length: offset === 0 ? 6 : 2 }, (_, index) => {
        const number = offset + index + 1;
        return { name: `Artist ${number}`, imageUrl: null };
      });
      body = { items, total: 8, nextOffset: offset === 0 ? 6 : null };
    } else if (path === "/api/library/tracks/genres") {
      body = ["Pop"];
    } else if (path === "/api/recommendations/home") {
      body = { tracks: [track], generatedAt: "2026-08-17T00:00:00.000Z" };
    } else if (path === "/api/catalog/albums/recent") {
      body = [];
    } else if (path === "/api/catalog/artists/page") {
      body = { items: [], total: 0, nextOffset: null };
    } else if (path === "/api/analytics/recently-played") {
      body = [];
    } else if (path === "/api/billing/quota") {
      body = {
        isPremium: true,
        uploads: { used: 0, limit: null, remaining: null },
        aiRequests: { used: 0, limit: null, remaining: null },
        customPresets: { used: 0, limit: null, remaining: null },
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

async function goToNextPage(page: Page, label: string) {
  await page
    .locator(`section[aria-label="${label}"]`)
    .getByRole("button", { name: "Página siguiente" })
    .click();
}

test("library loads albums and artists in draggable pages of six", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop drag coverage");
  await mockSession(page);
  await page.goto("/library?tab=albums");

  await expect(page.getByText("Album 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Album 7", { exact: true })).not.toBeInViewport();
  await expect(page.getByText("Album 7", { exact: true })).toBeAttached();
  const albumGrid = page.locator('[aria-label="Álbumes, página 1 de 2"]');
  await expect(albumGrid).toHaveCSS("grid-template-columns", /.+ .+ .+/);
  const albumViewport = page
    .locator('section[aria-label="Álbumes"] [data-testid="library-carousel-viewport"]')
    .first();
  const nextButton = page.getByRole("button", { name: "Página siguiente" });
  const [viewportBox, nextButtonBox] = await Promise.all([
    albumViewport.boundingBox(),
    nextButton.boundingBox(),
  ]);
  expect(viewportBox).not.toBeNull();
  expect(nextButtonBox).not.toBeNull();
  if (viewportBox && nextButtonBox) {
    expect(Math.abs(
      nextButtonBox.y + nextButtonBox.height / 2 -
        (viewportBox.y + viewportBox.height / 2),
    )).toBeLessThan(3);
  }
  await goToNextPage(page, "Álbumes");
  await expect(page.getByText("Album 7", { exact: true })).toBeInViewport();

  await page.getByRole("button", { name: "Artistas" }).click();
  await expect(page.getByText("Artist 1", { exact: true })).toBeVisible();
  await goToNextPage(page, "Artistas");
  await expect(page.getByText("Artist 7", { exact: true })).toBeInViewport();
});

test("Cast loads the active track and exposes connected state", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Web Cast targets Chromium");
  await mockSession(page);
  await page.addInitScript(() => {
    const listeners = new Map<string, Array<() => void>>();
    let castState = "NOT_CONNECTED";
    const remotePlayer = {
      isPaused: true,
      currentTime: 0,
      duration: 0,
      volumeLevel: 0.8,
      isMuted: false,
      playerState: "IDLE",
      idleReason: undefined,
      mediaInfo: null,
    };
    const emit = (type: string) => listeners.get(type)?.forEach((fn) => fn());
    const context = {
      setOptions: (options: unknown) => {
        (window as typeof window & { __castOptions?: unknown }).__castOptions =
          options;
      },
      getCastState: () => castState,
      requestSession: async () => {
        castState = "CONNECTED";
        emit("cast-state");
      },
      getCurrentSession: () => ({
        loadMedia: async (request: unknown) => {
          (window as typeof window & { __castLoad?: unknown }).__castLoad =
            request;
          const media = (request as { mediaInfo: { contentId: string; duration: number } })
            .mediaInfo;
          remotePlayer.mediaInfo = { contentId: media.contentId } as never;
          remotePlayer.duration = media.duration;
          remotePlayer.isPaused = false;
          remotePlayer.playerState = "PLAYING";
          emit("media-info");
          emit("paused");
        },
      }),
      endCurrentSession: () => {
        castState = "NOT_CONNECTED";
        emit("cast-state");
      },
      addEventListener: (type: string, listener: () => void) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
    };
    class MediaInfo {
      metadata?: unknown;
      duration = 0;
      constructor(
        public contentId: string,
        public contentType: string,
      ) {}
    }
    class LoadRequest {
      autoplay = true;
      currentTime = 0;
      constructor(public mediaInfo: unknown) {}
    }
    const chromeObject = (window as typeof window & { chrome?: Record<string, unknown> })
      .chrome ?? {};
    chromeObject.cast = {
      AutoJoinPolicy: { ORIGIN_SCOPED: "origin_scoped" },
      Image: class Image {
        constructor(public url: string) {}
      },
      media: {
        MediaInfo,
        LoadRequest,
        MusicTrackMediaMetadata: class MusicTrackMediaMetadata {},
      },
    };
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: chromeObject,
    });
    (window as typeof window & { cast?: unknown }).cast = {
      framework: {
        CastContext: { getInstance: () => context },
        CastState: {
          NO_DEVICES_AVAILABLE: "NO_DEVICES_AVAILABLE",
          NOT_CONNECTED: "NOT_CONNECTED",
          CONNECTING: "CONNECTING",
          CONNECTED: "CONNECTED",
        },
        CastContextEventType: { CAST_STATE_CHANGED: "cast-state" },
        RemotePlayerEventType: {
          IS_PAUSED_CHANGED: "paused",
          CURRENT_TIME_CHANGED: "time",
          DURATION_CHANGED: "duration",
          VOLUME_LEVEL_CHANGED: "volume",
          IS_MUTED_CHANGED: "muted",
          MEDIA_INFO_CHANGED: "media-info",
          PLAYER_STATE_CHANGED: "player-state",
        },
        RemotePlayer: class RemotePlayer {
          constructor() {
            return remotePlayer;
          }
        },
        RemotePlayerController: class RemotePlayerController {
          addEventListener(type: string, listener: () => void) {
            listeners.set(type, [...(listeners.get(type) ?? []), listener]);
          }
          playOrPause() {
            remotePlayer.isPaused = !remotePlayer.isPaused;
            emit("paused");
          }
          seek() {
            emit("time");
          }
          setVolumeLevel() {
            emit("volume");
          }
          muteOrUnmute() {
            remotePlayer.isMuted = !remotePlayer.isMuted;
            emit("muted");
          }
        },
      },
    };
  });

  await page.goto("/inicio");
  await page
    .getByRole("button", { name: /^(Reproducir|Play)$/ })
    .dispatchEvent("click");
  const castButton = page.getByRole("button", {
    name: "Transmitir con Google Cast",
  });
  await expect(castButton).toBeVisible();
  await castButton.click();
  await expect(
    page.getByRole("button", { name: "Desconectar Google Cast" }),
  ).toBeVisible();
  const contentId = await page.evaluate(() => {
    const request = (window as typeof window & { __castLoad?: unknown })
      .__castLoad as { mediaInfo?: { contentId?: string } } | undefined;
    return request?.mediaInfo?.contentId;
  });
  expect(contentId).toBe(track.fileUrlRemote);
});
