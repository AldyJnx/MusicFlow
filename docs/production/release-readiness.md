# MusicFlow Production Readiness

## Release scope

The first public release targets Android. Google Cast has active senders in
mobile and web, but still requires receiver publication and real-device tests.
Mobile billing remains disabled until Google Play Billing and StoreKit are
implemented.

## Environments

- Development uses `apps/backend/.env` and
  `apps/mobile/config/development.json`.
- Staging and production must use separate PostgreSQL, Redis, R2, push
  notification, Anthropic and Sentry projects.
- Mobile builds receive public configuration with
  `--dart-define-from-file`. Never place signing keys or service-account JSON
  in these files.
- Production backend must define `CORS_ORIGINS`, strong independent JWT
  secrets, `REDIS_URL`, R2 credentials and push-provider credentials.
- Set `ENABLE_SWAGGER=false` in production unless documentation is protected
  behind an internal network or gateway.

## Database and backups

1. Take a PostgreSQL snapshot before each release.
2. Run `pnpm --filter @musicflow/backend prisma:migrate:deploy`.
3. Verify `GET /api/health` reports `status: ok`.
4. Restore the latest snapshot into an isolated database at least monthly.
5. Record restore duration, row counts and migration version.

## Android release

- Package ID: `com.musicflow.app`. Confirm availability before the first Play
  Console upload; it becomes permanent after publication.
- Compile and target SDK: 36.
- Release cleartext traffic is disabled. Development enables it only through
  the debug manifest overlay.
- Generate an upload key, keep it outside Git and configure the four
  `ANDROID_*` GitHub secrets used by `mobile-release.yml`.
- Configure `MOBILE_API_BASE_URL`, Cast and push-provider GitHub variables.
- Trigger `Android Release` or push a `mobile-v*` tag, then upload the signed
  AAB artifact to an Internal Testing track.

## iOS preparation

- Bundle ID: `com.musicflow.app`.
- Select the real Apple Development Team in Xcode and create App Store signing
  certificates/provisioning profiles.
- Configure APNs with the selected push provider and enable Push Notifications
  plus Background Modes / Remote notifications.
- Add App Store privacy details and test account-deletion links before review.

## Observability and operations

- Set `SENTRY_DSN`, environment, release and a conservative trace sample rate.
- Alert on elevated 5xx rate, queue failures, Redis disconnections, database
  saturation, push delivery failures and R2 latency.
- Keep `/api/health` as the readiness probe and monitor it from outside the
  hosting provider.
- Rotate JWT, R2, Anthropic, SMTP, push-provider and billing credentials on a
  documented schedule.

## Verified build performance

- Backend recommendation tests run in isolated transpilation mode while
  `tsc --noEmit` remains a separate CI gate. The focused suite dropped from
  about 70 seconds to about 1.3 seconds; all 96 backend tests complete in
  about 50 seconds on the current Windows development machine.
- Vite uses esbuild for CSS minification. A measured Vite build dropped from
  about 65 seconds to about 24 seconds; warm full web builds complete in about
  22 seconds on the same machine.
- A cached Android release AAB compiles in about 59 seconds and currently
  weighs about 47.8 MB.
- Treat these as local baselines, not service-level objectives. CI runners and
  clean dependency caches will be slower.

## External release blockers

- Create and store the Android upload keystore; local `android/key.properties`
  is intentionally not committed.
- Configure the Apple Development Team, certificates and provisioning profiles.
- Create production push applications/APNs credentials and set the GitHub
  environment variables used by the release workflow.
- Deploy the Prisma migration and perform the backup restore drill.
- Publish the legal pages on the final HTTPS domain and complete legal review
  of music, lyric, artwork and artist-image licenses.

## Store material and legal review

- Publish privacy, terms, support and account-deletion pages under the final
  HTTPS domain.
- Verify licenses for every song, lyric, cover and artist image before public
  distribution. R2 availability is not evidence of distribution rights.
- Complete the Google Play Data Safety form and App Store privacy nutrition
  labels from the real data flows.
- Keep Premium purchase calls hidden until store-native billing and server
  receipt validation are complete.

## Exit criteria

- CI passes backend/web lint, typecheck, tests, builds, Playwright and Flutter
  analyze/widget tests/release build.
- A signed Android AAB installs through Internal Testing.
- Onboarding is shown once, follows persist, Home returns six diverse tracks,
  and an inactivity cycle produces at most one push notification.
- A backup restore drill and incident rollback have been exercised.
