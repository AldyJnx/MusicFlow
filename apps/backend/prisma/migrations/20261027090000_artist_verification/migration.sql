CREATE TYPE "ArtistVerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

ALTER TABLE "artists"
  ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "artist_verification_requests" (
  "id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "requester_user_id" TEXT NOT NULL,
  "status" "ArtistVerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_verification_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_verification_requests_artist_id_key"
  ON "artist_verification_requests"("artist_id");
CREATE INDEX "artist_verification_requests_status_created_at_idx"
  ON "artist_verification_requests"("status", "created_at" DESC);

ALTER TABLE "artist_verification_requests"
  ADD CONSTRAINT "artist_verification_requests_artist_id_fkey"
  FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_verification_requests"
  ADD CONSTRAINT "artist_verification_requests_requester_user_id_fkey"
  FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_verification_requests"
  ADD CONSTRAINT "artist_verification_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
