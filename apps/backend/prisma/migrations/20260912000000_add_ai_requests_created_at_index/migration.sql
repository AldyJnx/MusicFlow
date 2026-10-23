-- Supports the administrative AI request history, ordered newest first.
CREATE INDEX "ai_requests_created_at_idx" ON "ai_requests"("created_at" DESC);
