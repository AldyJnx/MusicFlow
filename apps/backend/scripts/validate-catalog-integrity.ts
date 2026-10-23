/**
 * Reconciles non-destructive catalog invariants after an R2 sync.
 *
 * It never invents images or album associations. Missing assets are reported
 * so the Admin sync result is marked incomplete, while feature credits are
 * safely derived from explicit `feat.`/`ft.` text when available.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const text = readFileSync(join(__dirname, "..", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2]
        .trim()
        .replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function featuredNames(value: string): string[] {
  const matches = value.matchAll(
    /(?:\(|\[|\s)(?:feat(?:uring)?|ft)\.?\s+([^\]\)]+)(?:\]|\)|$)/giu,
  );
  const seen = new Set<string>();
  const names: string[] = [];
  for (const match of matches) {
    for (const raw of match[1].split(/,|&|\band\b|\by\b/iu)) {
      const name = raw.trim();
      const key = normalize(name);
      if (name && key && !seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    }
  }
  return names;
}

type IntegritySummary = {
  artistImagesMissing: number;
  albumsIncomplete: number;
  trackCoverMismatches: number;
  trackCoversRepaired: number;
  duplicateArtists: number;
  featuredCreditsLinked: number;
};

async function main() {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    const [artists, albums, tracks] = await Promise.all([
      prisma.artist.findMany({
        select: { id: true, name: true, normalizedName: true, imageUrl: true },
      }),
      prisma.album.findMany({
        select: { id: true, title: true, artistId: true, coverArt: true },
      }),
      prisma.track.findMany({
        where: { isCatalog: true },
        select: {
          id: true,
          title: true,
          artist: true,
          albumId: true,
          coverArt: true,
        },
      }),
    ]);
    const artistByNormalizedName = new Map(
      artists.map((artist) => [artist.normalizedName, artist.id]),
    );
    const albumById = new Map(albums.map((album) => [album.id, album]));
    let featuredCreditsLinked = 0;

    for (const track of tracks) {
      const credits = [...featuredNames(track.artist), ...featuredNames(track.title)];
      const seen = new Set<string>();
      const uniqueCredits = credits.filter((name) => {
        const key = normalize(name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      for (const [position, artistName] of uniqueCredits.entries()) {
        const artistId = artistByNormalizedName.get(normalize(artistName)) ?? null;
        await prisma.trackFeaturedArtist.upsert({
          where: { trackId_artistName: { trackId: track.id, artistName } },
          create: { trackId: track.id, artistName, artistId, position },
          update: { artistId, position },
        });
        featuredCreditsLinked++;
      }
    }

    const duplicateArtists = new Map<string, string[]>();
    for (const artist of artists) {
      const key = normalize(artist.name);
      duplicateArtists.set(key, [...(duplicateArtists.get(key) ?? []), artist.name]);
    }
    const duplicateGroups = [...duplicateArtists.values()].filter(
      (names) => names.length > 1,
    );
    const missingArtistImages = artists.filter((artist) => !artist.imageUrl);
    const incompleteAlbums = albums.filter(
      (album) => !album.title.trim() || !album.coverArt || !album.artistId,
    );
    const trackCoverMismatches = tracks.filter((track) => {
      if (!track.albumId) return false;
      const album = albumById.get(track.albumId);
      return !album?.coverArt || album.coverArt !== track.coverArt;
    });
    const repairableCoverMismatches = trackCoverMismatches.filter((track) =>
      Boolean(track.albumId && albumById.get(track.albumId)?.coverArt),
    );
    if (repairableCoverMismatches.length) {
      await prisma.$transaction(
        repairableCoverMismatches.map((track) =>
          prisma.track.update({
            where: { id: track.id },
            data: { coverArt: albumById.get(track.albumId!)!.coverArt! },
          }),
        ),
      );
    }
    const summary: IntegritySummary = {
      artistImagesMissing: missingArtistImages.length,
      albumsIncomplete: incompleteAlbums.length,
      trackCoverMismatches:
        trackCoverMismatches.length - repairableCoverMismatches.length,
      trackCoversRepaired: repairableCoverMismatches.length,
      duplicateArtists: duplicateGroups.length,
      featuredCreditsLinked,
    };
    const valid =
      summary.artistImagesMissing === 0 &&
      summary.albumsIncomplete === 0 &&
      summary.trackCoverMismatches === 0 &&
      summary.duplicateArtists === 0;
    console.log(`Integrity: valid=${valid} ${JSON.stringify(summary)}`);
    if (!valid) {
      console.log(
        `Integrity issues: artistImages=${missingArtistImages
          .map((artist) => artist.name)
          .join(", ") || "none"}; albums=${incompleteAlbums
          .map((album) => album.title || album.id)
          .join(", ") || "none"}; coverMismatches=${trackCoverMismatches
          .map((track) => track.title)
          .join(", ") || "none"}; duplicates=${duplicateGroups
          .map((names) => names.join(" / "))
          .join("; ") || "none"}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
