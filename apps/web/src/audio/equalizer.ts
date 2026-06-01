export const EQ_FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;
export const EQ_BAND_COUNT = EQ_FREQUENCIES.length;
export const EQ_MIN_GAIN_DB = -15;
export const EQ_MAX_GAIN_DB = 15;

export interface EQState {
  bands: number[];
}

function clampGain(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(EQ_MAX_GAIN_DB, Math.max(EQ_MIN_GAIN_DB, value));
}

export class Equalizer {
  readonly input: GainNode;
  readonly output: GainNode;
  private readonly context: AudioContext;
  private readonly filters: BiquadFilterNode[];

  constructor(context: AudioContext) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();

    this.filters = EQ_FREQUENCIES.map((frequency, index) => {
      const filter = context.createBiquadFilter();
      if (index === 0) {
        filter.type = "lowshelf";
      } else if (index === EQ_FREQUENCIES.length - 1) {
        filter.type = "highshelf";
      } else {
        filter.type = "peaking";
        filter.Q.value = 1.4;
      }
      filter.frequency.value = frequency;
      filter.gain.value = 0;
      return filter;
    });

    // Chain: input -> f0 -> f1 -> ... -> fN -> output
    this.input.connect(this.filters[0]);
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
    this.filters[this.filters.length - 1].connect(this.output);
  }

  setBand(index: number, gainDb: number, transitionMs = 0): void {
    if (index < 0 || index >= this.filters.length) return;
    const filter = this.filters[index];
    const target = clampGain(gainDb);
    if (transitionMs <= 0) {
      filter.gain.value = target;
      return;
    }
    const now = this.context.currentTime;
    filter.gain.cancelScheduledValues(now);
    filter.gain.setValueAtTime(filter.gain.value, now);
    filter.gain.linearRampToValueAtTime(target, now + transitionMs / 1000);
  }

  setBands(bands: number[], transitionMs = 0): void {
    for (let i = 0; i < this.filters.length; i++) {
      this.setBand(i, bands[i] ?? 0, transitionMs);
    }
  }

  reset(transitionMs = 0): void {
    this.setBands(new Array(EQ_BAND_COUNT).fill(0), transitionMs);
  }

  getBands(): number[] {
    return this.filters.map((f) => f.gain.value);
  }

  dispose(): void {
    try {
      this.input.disconnect();
      for (const filter of this.filters) {
        filter.disconnect();
      }
      this.output.disconnect();
    } catch {
      // already disconnected
    }
  }
}
