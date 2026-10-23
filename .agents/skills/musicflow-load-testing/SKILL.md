---
name: musicflow-load-testing
description: Run and maintain reproducible load tests for MusicFlow's NestJS API and web delivery. Use when sizing concurrent users, investigating latency/errors, or defining performance gates; do not use for ordinary unit tests.
---

# Musicflow Load Testing

Use k6 scripts committed under `apps/backend/load-tests/` for API load. Keep test traffic on a local, staging, or explicitly authorized environment; never direct high-volume tests at production by default.

## API workflow

1. Check `/health` and required test credentials before the run.
2. Use a ramp-up/steady/ramp-down scenario, not an immediate jump to the target virtual-user count.
3. Exercise representative authenticated and anonymous routes, with bounded payloads and no destructive write path unless explicitly requested.
4. Emit a JSON summary. Record throughput, HTTP failure rate, p50/p95/p99 latency, VUs, host CPU/RAM, database connection pool and Redis health.
5. Treat an aborted or resource-saturated local run as a capacity observation, not proof of a production limit.

Default acceptance gates, unless the task defines an SLO: error rate <1%, p95 <800 ms for read endpoints, p99 <2 s, and no sustained CPU/RAM or database-pool saturation. State the environment and limits with every result.

## Web workflow

Use Lighthouse for repeatable user-centric delivery metrics on a production build, and React Profiler only for diagnosing component re-renders after an interaction. Do not claim that Lighthouse represents 10k concurrent users; browser concurrency and API concurrency are measured separately.

Run three Lighthouse samples after warm-up and report medians for performance, LCP, INP/TBT, CLS, transfer size and failed requests. Pair them with k6 API measurements when assessing end-to-end capacity.

## Safety and reproducibility

Parameterize `BASE_URL`, token/credentials and VU count through environment variables. Never commit secrets or auth tokens. Include commands for 10k/20k/30k targets and advise distributed k6/cloud runners when one machine cannot generate sufficient traffic.
