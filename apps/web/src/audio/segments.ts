import type { ReverbPresetName } from "./effects";

/** The non-band part of an EQ state — applied alongside the 10 bands. */
export interface SegmentEffects {
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPresetName;
  reverbAmount: number;
}

export interface EQSegment {
  id: string;
  label?: string | null;
  startMs: number;
  endMs: number;
  transitionMs?: number;
  bands: number[];
  /** Optional per-segment effects (bass boost, reverb, …). */
  effects?: SegmentEffects;
}

export interface FallbackEQ {
  bands: number[];
  /** The cascade's effects, restored when playback leaves a segment. */
  effects?: SegmentEffects;
}

/** What the scheduler needs to push a full EQ state into the audio graph. */
export interface EQTarget {
  setBands(bands: number[], transitionMs?: number): void;
  setEffects(effects: SegmentEffects): void;
}

/**
 * Watches playback position and applies the EQ segment that covers the current time.
 * Outside of any segment, falls back to a baseline (track / playlist / global EQ),
 * restoring both its bands AND its effects so the cascade is never silently flattened.
 */
export class SegmentScheduler {
  private segments: EQSegment[] = [];
  private fallback: FallbackEQ = { bands: new Array(10).fill(0) };
  private activeId: string | null = null;
  private listeners = new Set<(segment: EQSegment | null) => void>();
  private readonly target: EQTarget;

  constructor(target: EQTarget) {
    this.target = target;
  }

  setSegments(segments: EQSegment[]): void {
    this.segments = [...segments].sort((a, b) => a.startMs - b.startMs);
    this.activeId = null;
  }

  setFallback(fallback: FallbackEQ): void {
    this.fallback = fallback;
    // If currently outside any segment, re-apply the new fallback immediately.
    if (this.activeId === null) {
      this.applyFallback();
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
      this.target.setBands(current.bands, current.transitionMs ?? 500);
      // A segment may carry its own effects; if it doesn't, restore the
      // cascade's effects so it never inherits a previous segment's reverb.
      const fx = current.effects ?? this.fallback.effects;
      if (fx) this.target.setEffects(fx);
    } else {
      this.applyFallback();
    }

    for (const listener of this.listeners) {
      listener(current);
    }
  }

  /** Restore the cascade baseline (track / playlist / global): bands + effects. */
  private applyFallback(): void {
    this.target.setBands(this.fallback.bands, 500);
    if (this.fallback.effects) this.target.setEffects(this.fallback.effects);
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
