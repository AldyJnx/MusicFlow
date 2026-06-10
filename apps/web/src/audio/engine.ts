import { Equalizer } from "./equalizer";
import { EffectsChain, type ReverbPresetName } from "./effects";
import { SegmentScheduler, type EQSegment, type FallbackEQ } from "./segments";

export interface PlayerStatus {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  muted: boolean;
}

type StatusListener = (status: PlayerStatus) => void;

/**
 * Single audio engine for the app. Wraps an HTMLAudioElement and routes its
 * output through the EQ + effects chain.
 *
 * Chain: audio element -> EQ -> EffectsChain -> destination
 *
 * MUST be created from a user gesture (browser autoplay policy).
 */
export class AudioEngine {
  private audio: HTMLAudioElement;
  private context: AudioContext;
  private source: MediaElementAudioSourceNode;
  private masterGain: GainNode;

  readonly equalizer: Equalizer;
  readonly effects: EffectsChain;
  readonly segments: SegmentScheduler;

  private rafHandle: number | null = null;
  private statusListeners = new Set<StatusListener>();
  private endedListeners = new Set<() => void>();
  private lastVolume = 0.8;
  private currentTrackUrl: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.preload = "metadata";

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.context = new AudioContextCtor();

    this.source = this.context.createMediaElementSource(this.audio);
    this.equalizer = new Equalizer(this.context);
    this.effects = new EffectsChain(this.context);
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.lastVolume;

    // Chain
    this.source.connect(this.equalizer.input);
    this.equalizer.output.connect(this.effects.input);
    this.effects.output.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);

    this.segments = new SegmentScheduler(this.equalizer);

    this.audio.addEventListener("play", this.handleStateChange);
    this.audio.addEventListener("pause", this.handleStateChange);
    this.audio.addEventListener("volumechange", this.handleStateChange);
    this.audio.addEventListener("loadedmetadata", this.handleStateChange);
    this.audio.addEventListener("ended", this.handleEnded);
  }

  // ============ Playback ============

  async load(url: string): Promise<void> {
    if (this.currentTrackUrl === url) return;
    this.currentTrackUrl = url;
    this.audio.src = url;
    this.audio.load();
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
        reject(new Error("Failed to load track"));
      };
      this.audio.addEventListener("loadedmetadata", onLoaded);
      this.audio.addEventListener("error", onError);
    });
  }

  async play(): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    await this.audio.play();
    this.startPositionLoop();
  }

  pause(): void {
    this.audio.pause();
    this.stopPositionLoop();
  }

  async toggle(): Promise<void> {
    if (this.audio.paused) {
      await this.play();
    } else {
      this.pause();
    }
  }

  seek(positionMs: number): void {
    if (!Number.isFinite(positionMs)) return;
    const seconds = Math.max(0, positionMs / 1000);
    this.audio.currentTime = seconds;
    this.segments.refresh(positionMs);
  }

  setVolume(volume: number): void {
    const clamped = Math.min(1, Math.max(0, volume));
    this.masterGain.gain.value = clamped;
    this.audio.volume = clamped;
    if (clamped > 0) this.lastVolume = clamped;
    this.emitStatus();
  }

  setMuted(muted: boolean): void {
    if (muted) {
      this.lastVolume = this.audio.volume || this.lastVolume;
      this.setVolume(0);
    } else {
      this.setVolume(this.lastVolume || 0.8);
    }
  }

  // ============ Effects shortcuts ============

  applyPresetBands(bands: number[]): void {
    this.equalizer.setBands(bands, 250);
  }

  setEffects(opts: {
    bassBoost?: number;
    virtualizer?: number;
    loudness?: number;
    reverbPreset?: ReverbPresetName;
    reverbAmount?: number;
  }): void {
    if (opts.bassBoost !== undefined) this.effects.setBassBoost(opts.bassBoost);
    if (opts.virtualizer !== undefined)
      this.effects.setVirtualizer(opts.virtualizer);
    if (opts.loudness !== undefined) this.effects.setLoudness(opts.loudness);
    if (opts.reverbPreset !== undefined || opts.reverbAmount !== undefined) {
      this.effects.setReverb(
        opts.reverbPreset ?? "NONE",
        opts.reverbAmount ?? 0,
      );
    }
  }

  /** Current bands + effects, suitable for hydrating a UI panel. */
  getCurrentEqState(): {
    bands: number[];
    effects: ReturnType<EffectsChain["getState"]>;
  } {
    return {
      bands: this.equalizer.getBands(),
      effects: this.effects.getState(),
    };
  }

  // ============ Segments ============

  setSegments(segments: EQSegment[]): void {
    this.segments.setSegments(segments);
  }

  setFallbackEQ(fallback: FallbackEQ): void {
    this.segments.setFallback(fallback);
  }

  // ============ Status ============

  getStatus(): PlayerStatus {
    return {
      isPlaying: !this.audio.paused,
      positionMs: this.audio.currentTime * 1000,
      durationMs: Number.isFinite(this.audio.duration)
        ? this.audio.duration * 1000
        : 0,
      volume: this.audio.volume,
      muted: this.audio.volume === 0,
    };
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  onEnded(listener: () => void): () => void {
    this.endedListeners.add(listener);
    return () => {
      this.endedListeners.delete(listener);
    };
  }

  // ============ Lifecycle ============

  dispose(): void {
    this.stopPositionLoop();
    this.audio.removeEventListener("play", this.handleStateChange);
    this.audio.removeEventListener("pause", this.handleStateChange);
    this.audio.removeEventListener("volumechange", this.handleStateChange);
    this.audio.removeEventListener("loadedmetadata", this.handleStateChange);
    this.audio.removeEventListener("ended", this.handleEnded);
    this.audio.pause();
    this.audio.src = "";
    try {
      this.source.disconnect();
      this.equalizer.dispose();
      this.effects.dispose();
      this.masterGain.disconnect();
    } catch {
      // ignore
    }
    void this.context.close();
  }

  // ============ Internals ============

  private handleStateChange = (): void => {
    this.emitStatus();
  };

  private handleEnded = (): void => {
    this.stopPositionLoop();
    this.emitStatus();
    for (const listener of this.endedListeners) listener();
  };

  private startPositionLoop(): void {
    if (this.rafHandle !== null) return;
    const tick = () => {
      const positionMs = this.audio.currentTime * 1000;
      this.segments.tick(positionMs);
      this.emitStatus();
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  private stopPositionLoop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private emitStatus(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) listener(status);
  }
}

// Lazy singleton so we don't create AudioContext until needed (browser autoplay policy).
let engineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}

export function disposeAudioEngine(): void {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
}
