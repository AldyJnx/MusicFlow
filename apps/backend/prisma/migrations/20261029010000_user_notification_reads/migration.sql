CREATE TABLE "user_notification_reads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "notification_id" TEXT NOT NULL,
  "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_notification_reads_user_id_notification_id_key"
  ON "user_notification_reads"("user_id", "notification_id");
CREATE INDEX "user_notification_reads_user_id_read_at_idx"
  ON "user_notification_reads"("user_id", "read_at" DESC);

ALTER TABLE "user_notification_reads"
  ADD CONSTRAINT "user_notification_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
