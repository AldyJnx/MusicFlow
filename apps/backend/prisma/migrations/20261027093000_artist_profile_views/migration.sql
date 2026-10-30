CREATE TABLE "artist_profile_views" (
  "id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "viewed_on" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artist_profile_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_profile_views_artist_id_user_id_viewed_on_key"
  ON "artist_profile_views"("artist_id", "user_id", "viewed_on");
CREATE INDEX "artist_profile_views_artist_id_viewed_on_idx"
  ON "artist_profile_views"("artist_id", "viewed_on");

ALTER TABLE "artist_profile_views"
  ADD CONSTRAINT "artist_profile_views_artist_id_fkey"
  FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_profile_views"
  ADD CONSTRAINT "artist_profile_views_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
