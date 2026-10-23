---
name: musicflow-code-quality
description: Audit and gate MusicFlow backend and web code with formatting, linting, type checks, tests, coverage, and optional SonarQube. Use when evaluating code health, release readiness, or CI quality gates.
---

# Musicflow Code Quality

Run the narrowest relevant checks first, then repository-wide checks before reporting release readiness.

## Required evidence

- Web: Prettier check, ESLint, TypeScript build/type check, unit/e2e tests when affected.
- Backend: Prettier check, ESLint, TypeScript type check, focused Jest tests and relevant e2e tests.
- Use `git diff --check` to detect whitespace issues. Do not treat a clean formatter/linter as proof of functional correctness.

## Quality interpretation

Report command, scope, pass/fail and warnings separately. Track: lint errors, type errors, test pass rate, coverage lines/branches/functions/statements, duplicated code, complexity, vulnerabilities and maintainability issues.

SonarQube is optional but is the central dashboard when a reachable SonarQube server and project token are provided. Never expose that token. Its quality gate should fail on new-code blocker/critical bugs or vulnerabilities, coverage below the agreed target, and unresolved security hotspots. Do not invent SonarQube results when the server is unavailable.

Use coverage targets as gates only after measuring the baseline. A practical starting target for changed code is 80% line coverage and 70% branch coverage, with authentication, billing, permissions and mutations requiring focused tests regardless of aggregate coverage.
