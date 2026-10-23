---
name: musicflow-backend-production
description: Audit, harden, test, and operate the MusicFlow NestJS, Prisma, PostgreSQL, Redis, BullMQ, R2, Anthropic, and billing backend. Use when changing apps/backend, preparing deployment, investigating API latency, adding jobs or migrations, or reviewing security and observability.
---

# MusicFlow Backend Production

## Workflow

1. Trace the request or job across controller, DTO, guard, service, Prisma query, queue, storage, and external provider.
2. Confirm authentication, ownership, role checks, validation, rate limits, idempotency, transaction boundaries, and safe error responses.
3. Review query shape and indexes with realistic pagination. Avoid unbounded reads, N+1 queries, per-request remote bucket scans, and LLM calls in deterministic recommendation paths.
4. Keep external work resilient with timeouts, bounded retries, circuit-aware failures, queue deduplication, and structured logs without secrets or tokens.
5. Add unit tests for scoring and transformations, e2e tests for authorization and contracts, and migration tests for schema changes.
6. Verify typecheck, build, tests, migrations, liveness/readiness, graceful shutdown, and rollback instructions before release.

## Production Gates

- Use HTTPS-only production origins, strict CORS, security headers, global throttling, rotated secrets, and least-privilege R2/database credentials.
- Keep Swagger configurable and never expose admin functionality without explicit role guards.
- Monitor request p50/p95/p99, error rate, database pool, Redis health, queue lag, provider latency, and job failures.
- Back up PostgreSQL and test restoration. Apply Prisma migrations with `migrate deploy`, never `migrate dev`, in production.
- Redact passwords, JWTs, reset tokens, API keys, signed URLs, and payment data from logs and telemetry.

## Verification

Run `pnpm run typecheck`, `pnpm run build`, focused Jest suites, and relevant e2e tests. Diagnose open handles or suites exceeding the CI budget instead of merely raising timeouts.
