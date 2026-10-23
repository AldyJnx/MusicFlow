/**
 * Repairs catalog rows that a legacy import treated as a different primary
 * artist because the source name contained `feat.`/`ft.`.  Credits are kept
 * per track and link to a catalog Artist only when that artist already exists.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  for (const line of readFileSync(join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
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

function isCompositeArtistName(value: string): boolean {
  return /\s+(?:feat(?:uring)?|ft)\.?\s+/iu.test(value) || value.includes(",");
}

type CatalogArtist = {
  id: string;
  normalizedName: string;
  name: string;
  imageUrl: string | null;
};

/**
 * Legacy catalog imports sometimes stored a collaboration as one artist name,
 * including comma-separated names such as `Invitado, Artista registrado`.
 * A standalone catalog artist is selected only when one of those names is
 * already registered; every other name remains a per-track credit.
 */
function splitFeaturing(
  value: string,
  artistByName: Map<string, CatalogArtist>,
): { primary: CatalogArtist; credits: string[] } | null {
  const match = /^(.*?)\s+(?:feat(?:uring)?|ft)\.?\s+(.+?)\s*$/iu.exec(value);
  const commaParts = value.split(",").map((name) => name.trim()).filter(Boolean);
  const explicitPrimary = match?.[1].trim();
  const primary = explicitPrimary
    ? artistByName.get(normalize(explicitPrimary))
    : commaParts.map((name) => artistByName.get(normalize(name))).find(Boolean);
  if (!primary) return null;

  const creditText = explicitPrimary
    ? match![2]
    : commaParts.filter((name) => normalize(name) !== primary.normalizedName).join(",");
  const credits = creditText
    .split(/,|&|\band\b|\by\b/iu)
    .map((name) => name.trim())
    .filter(Boolean);
  return credits.length ? { primary, credits } : null;
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient();
  const apply = process.argv.includes("--apply");
  try {
    const [artists, tracks, albums] = await Promise.all([
      prisma.artist.findMany({ select: { id: true, normalizedName: true, name: true, imageUrl: true } }),
      prisma.track.findMany({
        where: { isCatalog: true },
        select: { id: true, title: true, artist: true, artistId: true, albumId: true },
      }),
      prisma.album.findMany({
        select: {
          id: true,
          title: true,
          coverArt: true,
          artistId: true,
          artist: { select: { name: true } },
        },
      }),
    ]);
    const artistByName = new Map(artists.map((artist) => [artist.normalizedName, artist]));
    const trackIdsByArtistAndTitle = new Map<string, string[]>();
    for (const track of tracks) {
      const key = `${normalize(track.artist)}:${normalize(track.title)}`;
      trackIdsByArtistAndTitle.set(key, [...(trackIdsByArtistAndTitle.get(key) ?? []), track.id]);
    }
    const tracksByAlbum = new Map<string, typeof tracks>();
    for (const track of tracks) {
      if (!track.albumId) continue;
      tracksByAlbum.set(track.albumId, [...(tracksByAlbum.get(track.albumId) ?? []), track]);
    }
    let repaired = 0;
    let creditsLinked = 0;
    let skippedCollisions = 0;
    const tracksToMoveToCanonicalAlbum: Array<{
      sourceAlbum: (typeof albums)[number];
      targetAlbum: (typeof albums)[number];
      tracks: (typeof tracks)[number][];
    }> = [];
    const repairedPrimaryByTrackId = new Map<string, CatalogArtist>();

    for (const track of tracks) {
      const parsed = splitFeaturing(track.artist, artistByName);
      if (!parsed) continue;
      const targetKey = `${parsed.primary.normalizedName}:${normalize(track.title)}`;
      const collisionIds = (trackIdsByArtistAndTitle.get(targetKey) ?? []).filter(
        (id) => id !== track.id,
      );
      if (collisionIds.length) {
        skippedCollisions++;
        console.warn(
          `Skipping ${track.id}: ${track.artist} would collide with existing track(s) ${collisionIds.join(", ")} for ${parsed.primary.name} - ${track.title}.`,
        );
        continue;
      }
      repairedPrimaryByTrackId.set(track.id, parsed.primary);
      repaired++;
      creditsLinked += parsed.credits.filter((name) => artistByName.has(normalize(name))).length;
      console.log(
        `${apply ? "Repairing" : "Would repair"} ${track.id}: ${track.artist} -> ${parsed.primary.name} ft. ${parsed.credits.join(", ")}`,
      );
      if (!apply) continue;
      await prisma.$transaction(async (tx) => {
        await tx.track.update({
          where: { id: track.id },
          data: {
            artist: parsed.primary.name,
            artistId: parsed.primary.id,
            artistImage: parsed.primary.imageUrl,
          },
        });
        await tx.trackFeaturedArtist.deleteMany({ where: { trackId: track.id } });
        await tx.trackFeaturedArtist.createMany({
          data: parsed.credits.map((artistName, position) => ({
            trackId: track.id,
            artistName,
            artistId: artistByName.get(normalize(artistName))?.id ?? null,
            position,
          })),
        });
      });
    }

    const albumsToRepair = albums.flatMap((album) => {
      const albumTracks = tracksByAlbum.get(album.id) ?? [];
      const parsedAlbumArtist = splitFeaturing(album.artist.name, artistByName);
      if (!albumTracks.length || !parsedAlbumArtist) return [];
      const primary = parsedAlbumArtist.primary;
      const everyTrackMatchesPrimary = albumTracks.every(
        (track) => (repairedPrimaryByTrackId.get(track.id)?.id ?? track.artistId) === primary.id,
      );
      if (!everyTrackMatchesPrimary || album.artistId === primary.id) return [];
      const duplicateAlbum = albums.find(
        (candidate) =>
          candidate.id !== album.id &&
          candidate.artistId === primary.id &&
          normalize(candidate.title) === normalize(album.title),
      );
      if (duplicateAlbum) {
        tracksToMoveToCanonicalAlbum.push({
          sourceAlbum: album,
          targetAlbum: duplicateAlbum,
          tracks: albumTracks,
        });
        console.warn(
          `${apply ? "Moving" : "Would move"} ${albumTracks.length} track(s) from duplicate album ${album.id} to ${duplicateAlbum.id} for ${primary.name} - ${album.title}.`,
        );
        return [];
      }
      return [{ album, primary }];
    });
    for (const { album, primary } of albumsToRepair) {
      console.log(`${apply ? "Repairing" : "Would repair"} album ${album.id}: artist -> ${primary.name}`);
      if (apply) await prisma.album.update({ where: { id: album.id }, data: { artistId: primary.id } });
    }
    for (const { sourceAlbum, targetAlbum, tracks: albumTracks } of tracksToMoveToCanonicalAlbum) {
      if (apply) {
        await prisma.$transaction(
          albumTracks.map((track) =>
            prisma.track.update({
              where: { id: track.id },
              data: {
                albumId: targetAlbum.id,
                album: targetAlbum.title,
                coverArt: targetAlbum.coverArt,
              },
            }),
          ),
        );
      }
      console.log(
        `${apply ? "Moved" : "Would move"} ${albumTracks.length} track(s) from album ${sourceAlbum.id} to canonical album ${targetAlbum.id}.`,
      );
    }

    const orphanedCompositeArtists = (await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { tracks: true, followers: true, featuredOn: true } },
        albums: { select: { _count: { select: { tracks: true } } } },
      },
    })).filter(
      (artist) =>
        isCompositeArtistName(artist.name) &&
        artist._count.tracks === 0 &&
        artist._count.followers === 0 &&
        artist._count.featuredOn === 0 &&
        artist.albums.every((album) => album._count.tracks === 0),
    );
    for (const artist of orphanedCompositeArtists) {
      console.log(`${apply ? "Removing" : "Would remove"} orphaned composite artist ${artist.id}: ${artist.name}.`);
      if (apply) await prisma.artist.delete({ where: { id: artist.id } });
    }

    console.log(
      `Featuring repair ${apply ? "applied" : "preview"}: ${repaired} tracks normalized, ${albumsToRepair.length} albums reassigned, ${tracksToMoveToCanonicalAlbum.length} duplicate album group(s) consolidated, ${orphanedCompositeArtists.length} orphaned profile(s) removed, ${creditsLinked} credits linked, ${skippedCollisions} duplicate track candidate(s) skipped.`,
    );
    if (!apply && repaired) console.log("Review this preview, then rerun with --apply to persist it.");
  } finally {
    await prisma.$disconnect();
  }
}

void main();
