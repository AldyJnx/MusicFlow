-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "is_catalog" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tracks_is_catalog_updated_at_idx" ON "tracks"("is_catalog", "updated_at" DESC);
