-- Single-use authorization codes returned after a successful third-party OAuth
-- callback. The SPA exchanges the code for its normal JWT session.
CREATE TABLE "oauth_login_tickets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oauth_login_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oauth_login_tickets_expires_at_idx"
  ON "oauth_login_tickets"("expires_at");

ALTER TABLE "oauth_login_tickets"
  ADD CONSTRAINT "oauth_login_tickets_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
