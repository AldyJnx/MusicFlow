-- Repair databases whose migration history was advanced without the original
-- 20260706045740_add_original_url_remote DDL reaching the physical table.
-- Kept idempotent so clean databases and correctly migrated environments are
-- unaffected.
ALTER TABLE "tracks"
ADD COLUMN IF NOT EXISTS "original_url_remote" TEXT;
