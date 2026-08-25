-- CreateEnum
CREATE TYPE "ArtistFollowSource" AS ENUM ('ONBOARDING', 'MANUAL');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN "last_active_at" TIMESTAMP(3),
ADD COLUMN "reengagement_notified_at" TIMESTAMP(3),
ADD COLUMN "notification_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "devices" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "artist_follows" (
  "user_id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "source" "ArtistFollowSource" NOT NULL DEFAULT 'MANUAL',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artist_follows_pkey" PRIMARY KEY ("user_id", "artist_id")
);

-- CreateTable
CREATE TABLE "recommendation_impressions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "track_id" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "played_at" TIMESTAMP(3),
  CONSTRAINT "recommendation_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artist_follows_artist_id_idx" ON "artist_follows"("artist_id");
CREATE INDEX "recommendation_impressions_user_id_shown_at_idx" ON "recommendation_impressions"("user_id", "shown_at" DESC);
CREATE INDEX "recommendation_impressions_track_id_shown_at_idx" ON "recommendation_impressions"("track_id", "shown_at" DESC);

-- AddForeignKey
ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_follows" ADD CONSTRAINT "artist_follows_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_impressions" ADD CONSTRAINT "recommendation_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_impressions" ADD CONSTRAINT "recommendation_impressions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
