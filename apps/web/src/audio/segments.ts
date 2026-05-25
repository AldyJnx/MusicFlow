import type { Equalizer } from "./equalizer";

export interface EQSegment {
  id: string;
  label?: string | null;
  startMs: number;
  endMs: number;
  transitionMs?: number;
  bands: number[];
}

export interface FallbackEQ {
  bands: number[];
}

/**
 * Watches playback position and applies the EQ segment that covers the current time.
 * Outside of any segment, falls back to a baseline (track / playlist / global EQ).
 */
export class SegmentScheduler {
  private segments: EQSegment[] = [];
  private fallback: FallbackEQ = { bands: new Array(10).fill(0) };
  private activeId: string | null = null;
  private listeners = new Set<(segment: EQSegment | null) => void>();
  private readonly equalizer: Equalizer;

  constructor(equalizer: Equalizer) {
    this.equalizer = equalizer;
  }

  setSegments(segments: EQSegment[]): void {
    this.segments = [...segments].sort((a, b) => a.startMs - b.startMs);
    this.activeId = null;
  }

  setFallback(fallback: FallbackEQ): void {
    this.fallback = fallback;
    // If currently outside any segment, re-apply the new fallback immediately.
    if (this.activeId === null) {
      this.equalizer.setBands(fallback.bands);
    }
  }

  /** Find segment that covers the given position. Returns null if none. */
  segmentAt(positionMs: number): EQSegment | null {
    for (const segment of this.segments) {
      if (positionMs >= segment.startMs && positionMs < segment.endMs) {
        return segment;
      }
      if (segment.startMs > positionMs) break;
    }
    return null;
  }

  /** Call this on every timeupdate / requestAnimationFrame tick. */
  tick(positionMs: number): void {
    const current = this.segmentAt(positionMs);
    const nextId = current?.id ?? null;
    if (nextId === this.activeId) return;

    this.activeId = nextId;
    if (current) {
      this.equalizer.setBands(current.bands, current.transitionMs ?? 500);
    } else {
      this.equalizer.setBands(this.fallback.bands, 500);
    }

    for (const listener of this.listeners) {
      listener(current);
    }
  }

  /** Force re-evaluation (e.g., after seek or segment edit). */
  refresh(positionMs: number): void {
    this.activeId = null;
    this.tick(positionMs);
  }

  onSegmentChange(listener: (segment: EQSegment | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
