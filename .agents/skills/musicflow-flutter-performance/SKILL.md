---
name: musicflow-flutter-performance
description: Profile and optimize the MusicFlow Flutter app for startup, navigation, rendering, network, memory, battery, and audio latency. Use when changing apps/mobile, investigating slow screens or playback, adding caching or pagination, or defining mobile performance gates.
---

# MusicFlow Flutter Performance

## Workflow

1. Establish a release/profile-mode baseline on a representative Android device. Record cold start, first useful frame, navigation latency, audio start latency, dropped frames, memory, and network request count.
2. Trace the affected flow before editing. Inspect Riverpod dependencies, router behavior, widget rebuilds, image decoding, list construction, Dio requests, audio initialization, and synchronous work on the UI isolate.
3. Fix the highest-impact bottleneck with the smallest compatible change. Preserve background audio, queue state, EQ state, deep links, and API contracts.
4. Prefer pagination, request deduplication, bounded caches, optimistic UI, image resizing, const widgets, selectors, and lazy initialization. Do not preload the full catalog or large WAV files.
5. Re-run the same profile scenario and report before/after measurements. Reject changes that only move work to app startup or grow memory without a measured benefit.

## Performance Gates

- Keep tab feedback below 100 ms and avoid synchronous network waits before navigation.
- Target API reads below 300 ms p95 and cached recommendation reads below 100 ms.
- Target playback UI feedback below 100 ms and audible start below 800 ms on stable Wi-Fi.
- Keep raster and UI frames within the device refresh budget; investigate repeated frames over 16.7 ms at 60 Hz.
- Bound every catalog, artwork, lyrics, and audio cache by entries, bytes, or time.

## Verification

Run `dart analyze lib test`, focused widget tests, and the affected integration flow. Use profile mode and DevTools for final measurements; debug-mode timings are not release evidence.
