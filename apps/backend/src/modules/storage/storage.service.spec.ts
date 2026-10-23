import { BadRequestException } from "@nestjs/common";

import {
  buildAlbumCoverKey,
  buildArtistImageKey,
  buildCatalogAudioKey,
  buildLyricsKey,
} from "./storage.service";

describe("buildCatalogAudioKey", () => {
  it("stores 50Cent - Wanksta at the root of music-flow", () => {
    expect(buildCatalogAudioKey("50Cent", "Wanksta", "wav")).toBe(
      "50Cent - Wanksta.wav",
    );
  });

  it("does not introduce a catalog folder or UUID", () => {
    const key = buildCatalogAudioKey("Juanes", "Para llevar", ".flac");

    expect(key).toBe("Juanes - Para llevar.flac");
    expect(key).not.toContain("/");
    expect(key).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27,}/i);
  });

  it("rejects formats other than WAV or FLAC", () => {
    expect(() => buildCatalogAudioKey("50Cent", "Wanksta", "mp3")).toThrow(
      BadRequestException,
    );
  });

  it("uses the requested root keys for profile, album and lyrics buckets", () => {
    expect(buildArtistImageKey("50Cent", "webp")).toBe("50Cent.webp");
    expect(buildAlbumCoverKey("24k Magic", "Bruno Mars", "avif")).toBe(
      "24k Magic - Bruno Mars.avif",
    );
    expect(buildLyricsKey("50 Cent", "Window Shopper")).toBe(
      "50 Cent - Window Shopper.lrc",
    );
  });

  it("never introduces folders or UUIDs for non-audio catalogue assets", () => {
    for (const key of [
      buildArtistImageKey("50Cent", "webp"),
      buildAlbumCoverKey("Invincible", "Michael Jackson", "webp"),
      buildLyricsKey("Michael Jackson", "Heaven Can Wait"),
    ]) {
      expect(key).not.toContain("/");
      expect(key).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27,}/i);
    }
  });
});
