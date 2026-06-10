export type ReverbPresetName =
  | "NONE"
  | "SMALL_ROOM"
  | "MEDIUM_ROOM"
  | "LARGE_ROOM"
  | "SMALL_HALL"
  | "LARGE_HALL"
  | "CATHEDRAL"
  | "PLATE"
  | "SPRING";

interface ReverbConfig {
  decaySeconds: number;
  preDelay: number;
}

const REVERB_PRESETS: Record<
  Exclude<ReverbPresetName, "NONE">,
  ReverbConfig
> = {
  SMALL_ROOM: { decaySeconds: 0.6, preDelay: 0.01 },
  MEDIUM_ROOM: { decaySeconds: 1.1, preDelay: 0.015 },
  LARGE_ROOM: { decaySeconds: 1.6, preDelay: 0.02 },
  SMALL_HALL: { decaySeconds: 2.0, preDelay: 0.03 },
  LARGE_HALL: { decaySeconds: 3.0, preDelay: 0.04 },
  CATHEDRAL: { decaySeconds: 4.5, preDelay: 0.06 },
  PLATE: { decaySeconds: 1.8, preDelay: 0.005 },
  SPRING: { decaySeconds: 1.3, preDelay: 0.008 },
};

function createImpulseResponse(
  context: AudioContext,
  config: ReverbConfig,
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.max(
    1,
    Math.floor(sampleRate * (config.decaySeconds + config.preDelay)),
  );
  const impulse = context.createBuffer(2, length, sampleRate);
  const preDelaySamples = Math.floor(sampleRate * config.preDelay);

  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
        continue;
      }
      const t = (i - preDelaySamples) / (length - preDelaySamples);
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
    }
  }

  return impulse;
}

export class EffectsChain {
  readonly input: GainNode;
  readonly output: GainNode;

  private readonly bassBoostFilter: BiquadFilterNode;
  private readonly loudnessFilter: BiquadFilterNode;
  private readonly virtualizerSplitter: ChannelSplitterNode;
  private readonly virtualizerMerger: ChannelMergerNode;
  private readonly virtualizerDelay: DelayNode;
  private readonly dryGain: GainNode;
  private readonly wetGain: GainNode;
  private readonly convolver: ConvolverNode;

  private currentReverb: ReverbPresetName = "NONE";
  // Cached copy of the last values applied through the public setters.
  // Web Audio nodes hold their derived gains (post-normalization), so we
  // keep the original 0–100 amounts here so callers can read back the same
  // values they wrote — used by useEqualizer to hydrate the UI from the
  // engine when a panel is reopened after the AI applied a curve.
  private cachedBassBoost = 0;
  private cachedVirtualizer = 0;
  private cachedLoudness = 0;
  private cachedReverbAmount = 0;
  private readonly context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();

    this.bassBoostFilter = context.createBiquadFilter();
    this.bassBoostFilter.type = "lowshelf";
    this.bassBoostFilter.frequency.value = 120;
    this.bassBoostFilter.gain.value = 0;

    this.loudnessFilter = context.createBiquadFilter();
    this.loudnessFilter.type = "peaking";
    this.loudnessFilter.frequency.value = 3500;
    this.loudnessFilter.Q.value = 0.7;
    this.loudnessFilter.gain.value = 0;

    this.virtualizerSplitter = context.createChannelSplitter(2);
    this.virtualizerMerger = context.createChannelMerger(2);
    this.virtualizerDelay = context.createDelay(0.05);
    this.virtualizerDelay.delayTime.value = 0;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 1;

    this.wetGain = context.createGain();
    this.wetGain.gain.value = 0;

    this.convolver = context.createConvolver();

    this.input.connect(this.bassBoostFilter);
    this.bassBoostFilter.connect(this.loudnessFilter);
    this.loudnessFilter.connect(this.virtualizerSplitter);
    this.virtualizerSplitter.connect(this.virtualizerMerger, 0, 0);
    this.virtualizerSplitter.connect(this.virtualizerDelay, 1);
    this.virtualizerDelay.connect(this.virtualizerMerger, 0, 1);
    this.virtualizerMerger.connect(this.dryGain).connect(this.output);
    this.virtualizerMerger
      .connect(this.convolver)
      .connect(this.wetGain)
      .connect(this.output);
  }

  setBassBoost(amount: number): void {
    const clamped = Math.min(100, Math.max(0, amount));
    this.cachedBassBoost = clamped;
    this.bassBoostFilter.gain.value = (clamped / 100) * 12;
  }

  setVirtualizer(amount: number): void {
    const clamped = Math.min(100, Math.max(0, amount));
    this.cachedVirtualizer = clamped;
    this.virtualizerDelay.delayTime.value = (clamped / 100) * 0.015;
  }

  setLoudness(amount: number): void {
    const clamped = Math.min(100, Math.max(0, amount));
    this.cachedLoudness = clamped;
    this.loudnessFilter.gain.value = (clamped / 100) * 6;
  }

  setReverb(preset: ReverbPresetName, amount: number): void {
    const clampedAmount = Math.min(100, Math.max(0, amount));
    this.cachedReverbAmount = clampedAmount;
    const normalized = clampedAmount / 100;
    if (preset === "NONE" || normalized === 0) {
      this.wetGain.gain.value = 0;
      this.dryGain.gain.value = 1;
      this.currentReverb = preset;
      return;
    }
    if (preset !== this.currentReverb) {
      this.convolver.buffer = createImpulseResponse(
        this.context,
        REVERB_PRESETS[preset],
      );
      this.currentReverb = preset;
    }
    this.wetGain.gain.value = normalized;
    this.dryGain.gain.value = 1 - normalized * 0.4;
  }

  /**
   * Last values written via the setters above. Reverb amount goes back to
   * 0 if the preset is "NONE" so the UI doesn't display a phantom number.
   */
  getState(): {
    bassBoost: number;
    virtualizer: number;
    loudness: number;
    reverbPreset: ReverbPresetName;
    reverbAmount: number;
  } {
    return {
      bassBoost: this.cachedBassBoost,
      virtualizer: this.cachedVirtualizer,
      loudness: this.cachedLoudness,
      reverbPreset: this.currentReverb,
      reverbAmount: this.currentReverb === "NONE" ? 0 : this.cachedReverbAmount,
    };
  }

  dispose(): void {
    try {
      this.input.disconnect();
      this.bassBoostFilter.disconnect();
      this.loudnessFilter.disconnect();
      this.virtualizerSplitter.disconnect();
      this.virtualizerDelay.disconnect();
      this.virtualizerMerger.disconnect();
      this.dryGain.disconnect();
      this.wetGain.disconnect();
      this.convolver.disconnect();
      this.output.disconnect();
    } catch {
      // ignore
    }
  }
}
