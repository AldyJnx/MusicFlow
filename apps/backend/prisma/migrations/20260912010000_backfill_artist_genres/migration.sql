-- Populate empty artist genres from catalog tracks already tied to the artist.
UPDATE "artists" AS artist
SET "genres" = ARRAY[
  (
    SELECT NULLIF(BTRIM(track."genre"), '')
    FROM "tracks" AS track
    WHERE NULLIF(BTRIM(track."genre"), '') IS NOT NULL
      AND (track."artist_id" = artist."id" OR LOWER(track."artist") = LOWER(artist."name"))
    ORDER BY track."created_at" DESC
    LIMIT 1
  )
]
WHERE CARDINALITY(artist."genres") = 0
  AND EXISTS (
    SELECT 1
    FROM "tracks" AS track
    WHERE NULLIF(BTRIM(track."genre"), '') IS NOT NULL
      AND (track."artist_id" = artist."id" OR LOWER(track."artist") = LOWER(artist."name"))
  );
