-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];
