-- Preserve an administrator-selected Cloudflare R2 lyric object by URL.
-- The object remains in its original bucket and is not copied on association.
ALTER TABLE "tracks" ADD COLUMN "lyrics_url" TEXT;
