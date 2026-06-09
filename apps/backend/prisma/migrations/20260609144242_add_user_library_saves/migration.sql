-- CreateTable
CREATE TABLE "user_library_saves" (
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_library_saves_pkey" PRIMARY KEY ("user_id","track_id")
);

-- CreateIndex
CREATE INDEX "user_library_saves_user_id_saved_at_idx" ON "user_library_saves"("user_id", "saved_at" DESC);

-- AddForeignKey
ALTER TABLE "user_library_saves" ADD CONSTRAINT "user_library_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library_saves" ADD CONSTRAINT "user_library_saves_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
