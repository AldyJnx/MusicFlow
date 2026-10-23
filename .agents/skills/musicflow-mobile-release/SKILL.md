---
name: musicflow-mobile-release
description: Prepare and verify MusicFlow Flutter releases for Google Play and App Store, including identifiers, signing, permissions, privacy declarations, CI artifacts, store metadata, staged rollout, and rollback. Use when editing mobile platform files or preparing internal, closed, TestFlight, or production releases.
---

# MusicFlow Mobile Release

## Workflow

1. Confirm final Android application ID, iOS bundle ID, version name/build number, supported OS versions, and release environment.
2. Verify release signing uses protected CI secrets and never debug keys. Keep key files, provisioning profiles, and credentials out of Git.
3. Audit permissions and platform declarations against real features. Require HTTPS in release and remove unused permissions and capabilities.
4. Run analyze, unit/widget/integration tests, release builds, and smoke tests on physical Android and iOS devices.
5. Validate background audio, notifications, deep links, account deletion, offline/error states, accessibility, and privacy disclosures.
6. Distribute through internal testing first, collect crash/performance evidence, then promote the same artifact through staged rollout.

## Android Gate

- Use a non-example application ID, current required target API, Play App Signing, an AAB artifact, incremented versionCode, Data Safety answers, privacy policy URL, and account-deletion URL.
- Verify foreground media service and notification permissions on supported Android versions.

## iOS Gate

- Use a non-example bundle ID, Apple team signing, APNs and background-audio capabilities only when configured, privacy manifests, App Privacy answers, and TestFlight validation.
- Confirm account deletion is discoverable in the app and subscription UI does not advertise unavailable purchases.

## Release Evidence

Record artifact hashes, commit, environment, migration version, test results, known risks, rollout percentage, monitoring links, and rollback procedure for each release.
