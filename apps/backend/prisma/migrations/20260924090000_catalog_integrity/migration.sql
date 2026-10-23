-- Canonical artist identity and per-track featuring credits.
-- The migration first merges case/diacritic/punctuation variants, preserving
-- all catalog relations, then makes normalized identity unique.

ALTER TABLE "artists" ADD COLUMN "normalized_name" TEXT;

UPDATE "artists"
SET "normalized_name" = regexp_replace(
  lower(
    translate(
      "name",
      'ÁÀÄÂÃÅáàäâãåÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
    )
  ),
  '[^a-z0-9]+',
  '',
  'g'
);

CREATE TEMP TABLE artist_merge_map ON COMMIT DROP AS
SELECT id AS duplicate_id, canonical_id
FROM (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY "normalized_name"
      ORDER BY
        ("image_url" IS NOT NULL) DESC,
        "updated_at" DESC,
        id ASC
    ) AS canonical_id
  FROM "artists"
) ranked
WHERE id <> canonical_id;

-- Point tracks at their canonical artist before resolving album collisions.
UPDATE "tracks" AS track
SET "artist_id" = map.canonical_id,
    "artist" = canonical."name",
    "artist_image" = COALESCE(canonical."image_url", track."artist_image")
FROM artist_merge_map AS map
JOIN "artists" AS canonical ON canonical.id = map.canonical_id
WHERE track."artist_id" = map.duplicate_id;

-- If duplicate artists own albums with the same title, keep the canonical
-- artist's album and move its tracks there before deleting the duplicate album.
CREATE TEMP TABLE album_merge_map ON COMMIT DROP AS
SELECT duplicate_album.id AS duplicate_album_id, canonical_album.id AS canonical_album_id
FROM "albums" AS duplicate_album
JOIN artist_merge_map AS map ON map.duplicate_id = duplicate_album."artist_id"
JOIN "albums" AS canonical_album
  ON canonical_album."artist_id" = map.canonical_id
 AND lower(btrim(canonical_album.title)) = lower(btrim(duplicate_album.title));

UPDATE "tracks" AS track
SET "album_id" = album_map.canonical_album_id
FROM album_merge_map AS album_map
WHERE track."album_id" = album_map.duplicate_album_id;

DELETE FROM "albums" AS album
USING album_merge_map AS album_map
WHERE album.id = album_map.duplicate_album_id;

UPDATE "albums" AS album
SET "artist_id" = map.canonical_id
FROM artist_merge_map AS map
WHERE album."artist_id" = map.duplicate_id;

INSERT INTO "artist_follows" ("user_id", "artist_id", "source", "created_at")
SELECT follow."user_id", map.canonical_id, follow."source", follow."created_at"
FROM "artist_follows" AS follow
JOIN artist_merge_map AS map ON map.duplicate_id = follow."artist_id"
ON CONFLICT ("user_id", "artist_id") DO NOTHING;

DELETE FROM "artist_follows" AS follow
USING artist_merge_map AS map
WHERE follow."artist_id" = map.duplicate_id;

DELETE FROM "artists" AS artist
USING artist_merge_map AS map
WHERE artist.id = map.duplicate_id;

ALTER TABLE "artists" ALTER COLUMN "normalized_name" SET NOT NULL;
CREATE UNIQUE INDEX "artists_normalized_name_key" ON "artists"("normalized_name");

CREATE TABLE "track_featured_artists" (
  "id" TEXT NOT NULL,
  "track_id" TEXT NOT NULL,
  "artist_name" TEXT NOT NULL,
  "artist_id" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "track_featured_artists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "track_featured_artists_track_id_artist_name_key"
  ON "track_featured_artists"("track_id", "artist_name");
CREATE INDEX "track_featured_artists_artist_id_idx"
  ON "track_featured_artists"("artist_id");
CREATE INDEX "track_featured_artists_track_id_position_idx"
  ON "track_featured_artists"("track_id", "position");

ALTER TABLE "track_featured_artists"
  ADD CONSTRAINT "track_featured_artists_track_id_fkey"
  FOREIGN KEY ("track_id") REFERENCES "tracks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "track_featured_artists"
  ADD CONSTRAINT "track_featured_artists_artist_id_fkey"
  FOREIGN KEY ("artist_id") REFERENCES "artists"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
