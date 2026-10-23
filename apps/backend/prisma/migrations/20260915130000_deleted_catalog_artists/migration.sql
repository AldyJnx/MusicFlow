CREATE TABLE "deleted_catalog_artists" (
  "normalized_name" TEXT NOT NULL,
  "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deleted_catalog_artists_pkey" PRIMARY KEY ("normalized_name")
);
