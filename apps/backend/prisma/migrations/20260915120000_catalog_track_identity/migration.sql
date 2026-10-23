-- A storage key is not a catalog identity: historical imports could create
-- two catalog rows for the same displayed artist/title. Keep the row with the
-- richest curation data, then make that identity impossible to duplicate.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(BTRIM(artist)), LOWER(BTRIM(title))
      ORDER BY
        (album_id IS NOT NULL) DESC,
        (cover_art IS NOT NULL) DESC,
        (lyrics_lrc IS NOT NULL OR lyrics_text IS NOT NULL) DESC,
        updated_at DESC,
        id DESC
    ) AS duplicate_rank
  FROM tracks
  WHERE is_catalog = TRUE
)
DELETE FROM tracks AS track
USING ranked
WHERE track.id = ranked.id
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS tracks_catalog_artist_title_unique_ci
  ON tracks (LOWER(BTRIM(artist)), LOWER(BTRIM(title)))
  WHERE is_catalog = TRUE;
