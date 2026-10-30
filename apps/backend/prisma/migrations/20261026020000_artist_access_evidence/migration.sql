ALTER TABLE "artist_access_requests"
  ALTER COLUMN "evidence" DROP NOT NULL,
  ADD COLUMN "evidence_links" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "document_key" TEXT,
  ADD COLUMN "document_name" TEXT,
  ADD COLUMN "document_mime_type" TEXT,
  ADD COLUMN "document_size_bytes" INTEGER;
