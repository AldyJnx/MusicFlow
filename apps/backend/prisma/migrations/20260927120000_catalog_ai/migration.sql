-- Admin-only NVIDIA NIM catalog assistant.
-- Keeps its own runs/findings tables instead of reusing `ai_requests`, which
-- backs the end-user player assistant and is metered by the monthly AI quota.

CREATE TYPE "CatalogAiTask" AS ENUM (
  'ALBUM_YEAR',
  'TRACK_ALBUM_MATCH',
  'MISSING_LYRICS',
  'MISSING_ARTIST_IMAGE'
);

CREATE TYPE "CatalogAiFindingStatus" AS ENUM (
  'PROPOSED',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'FAILED'
);

CREATE TYPE "CatalogAiRunStatus" AS ENUM (
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'UNAVAILABLE'
);

CREATE TYPE "CatalogAiConfidence" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE "CatalogAiEntityType" AS ENUM (
  'ALBUM',
  'TRACK',
  'ARTIST'
);

CREATE TABLE "catalog_ai_runs" (
  "id" TEXT NOT NULL,
  "task" "CatalogAiTask" NOT NULL,
  "status" "CatalogAiRunStatus" NOT NULL DEFAULT 'COMPLETED',
  "error" TEXT NOT NULL DEFAULT '',
  "model_used" TEXT NOT NULL,
  "total_items" INTEGER NOT NULL DEFAULT 0,
  "proposed" INTEGER NOT NULL DEFAULT 0,
  "applied" INTEGER NOT NULL DEFAULT 0,
  "rejected" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "tokens_input" INTEGER NOT NULL DEFAULT 0,
  "tokens_output" INTEGER NOT NULL DEFAULT 0,
  "response_time_ms" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor_id" TEXT NOT NULL,
  CONSTRAINT "catalog_ai_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_ai_findings" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "status" "CatalogAiFindingStatus" NOT NULL DEFAULT 'PROPOSED',
  "entity_type" "CatalogAiEntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "current_value" TEXT,
  "proposed_value" JSONB NOT NULL,
  "confidence" "CatalogAiConfidence" NOT NULL DEFAULT 'LOW',
  "reasoning" TEXT NOT NULL DEFAULT '',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "applied_at" TIMESTAMP(3),
  "error" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_ai_findings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_ai_runs_task_created_at_idx"
  ON "catalog_ai_runs"("task", "created_at" DESC);

CREATE INDEX "catalog_ai_runs_actor_id_created_at_idx"
  ON "catalog_ai_runs"("actor_id", "created_at" DESC);

CREATE INDEX "catalog_ai_findings_run_id_status_idx"
  ON "catalog_ai_findings"("run_id", "status");

CREATE INDEX "catalog_ai_findings_entity_type_entity_id_idx"
  ON "catalog_ai_findings"("entity_type", "entity_id");

CREATE INDEX "catalog_ai_findings_status_created_at_idx"
  ON "catalog_ai_findings"("status", "created_at" DESC);

ALTER TABLE "catalog_ai_runs"
  ADD CONSTRAINT "catalog_ai_runs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "catalog_ai_findings"
  ADD CONSTRAINT "catalog_ai_findings_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "catalog_ai_runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
