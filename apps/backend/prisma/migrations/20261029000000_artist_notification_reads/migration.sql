CREATE TABLE "artist_notification_reads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "artist_id" TEXT NOT NULL,
  "notification_id" TEXT NOT NULL,
  "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artist_notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artist_notification_reads_user_id_artist_id_notification_id_key"
  ON "artist_notification_reads"("user_id", "artist_id", "notification_id");
CREATE INDEX "artist_notification_reads_artist_id_user_id_idx"
  ON "artist_notification_reads"("artist_id", "user_id");

ALTER TABLE "artist_notification_reads"
  ADD CONSTRAINT "artist_notification_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_notification_reads"
  ADD CONSTRAINT "artist_notification_reads_artist_id_fkey"
  FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
