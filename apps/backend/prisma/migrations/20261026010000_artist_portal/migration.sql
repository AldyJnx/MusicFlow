CREATE TYPE "ArtistMemberRole" AS ENUM ('OWNER', 'MANAGER', 'EDITOR', 'ANALYST');
CREATE TYPE "ArtistMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "ArtistAccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "artist_memberships" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "role" "ArtistMemberRole" NOT NULL DEFAULT 'EDITOR',
  "status" "ArtistMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "artist_access_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "status" "ArtistAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artist_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_memberships_user_id_artist_id_key" ON "artist_memberships"("user_id", "artist_id");
CREATE INDEX "artist_memberships_artist_id_status_idx" ON "artist_memberships"("artist_id", "status");
CREATE UNIQUE INDEX "artist_access_requests_user_id_artist_id_key" ON "artist_access_requests"("user_id", "artist_id");
CREATE INDEX "artist_access_requests_status_created_at_idx" ON "artist_access_requests"("status", "created_at" DESC);
CREATE INDEX "artist_access_requests_artist_id_idx" ON "artist_access_requests"("artist_id");

ALTER TABLE "artist_memberships" ADD CONSTRAINT "artist_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_memberships" ADD CONSTRAINT "artist_memberships_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_access_requests" ADD CONSTRAINT "artist_access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_access_requests" ADD CONSTRAINT "artist_access_requests_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_access_requests" ADD CONSTRAINT "artist_access_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
