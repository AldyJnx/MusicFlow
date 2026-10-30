-- A managed catalog of musical genres. Existing artist tags are imported so
-- the administrative CRUD never starts from an empty or fictional vocabulary.
CREATE TABLE "catalog_genres" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalized_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "catalog_genres_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_genres_name_key" ON "catalog_genres"("name");
CREATE UNIQUE INDEX "catalog_genres_normalized_name_key" ON "catalog_genres"("normalized_name");

ALTER TABLE "users" ADD COLUMN "bio" TEXT;

INSERT INTO "catalog_genres" ("id", "name", "normalized_name", "created_at", "updated_at")
SELECT
  md5(random()::text || clock_timestamp()::text || genre),
  genre,
  lower(regexp_replace(translate(genre,
    'ÁÀÄÂÃÅáàäâãåÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'), '[^a-z0-9]+', '', 'g')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT btrim(genre) AS genre
  FROM "artists", unnest("genres") AS genre
  WHERE btrim(genre) <> ''
) AS existing
ON CONFLICT ("normalized_name") DO NOTHING;
