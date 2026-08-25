const CAST_SENDER_URL =
  "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

export type CastAvailability =
  | "idle"
  | "loading"
  | "unsupported"
  | "no-devices"
  | "available";

export type CastConnection = "disconnected" | "connecting" | "connected";

export interface CastSnapshot {
  availability: CastAvailability;
  connection: CastConnection;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  muted: boolean;
  contentId: string | null;
}

export interface CastTrack {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  cover?: string | null;
  url: string;
  durationMs: number;
  mimeType?: string | null;
}

type Listener = (snapshot: CastSnapshot) => void;
type EventTargetLike = {
  addEventListener: (type: string, listener: () => void) => void;
};

interface CastSessionLike {
  loadMedia: (request: unknown) => Promise<unknown>;
}

interface CastContextLike extends EventTargetLike {
  setOptions: (options: Record<string, unknown>) => void;
  requestSession: () => Promise<unknown>;
  getCurrentSession: () => CastSessionLike | null;
  getCastState?: () => string;
  endCurrentSession: (stopCasting: boolean) => void;
}

interface RemotePlayerLike {
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volumeLevel: number;
  isMuted: boolean;
  playerState?: string;
  idleReason?: string;
  mediaInfo?: { contentId?: string } | null;
}

interface RemoteControllerLike extends EventTargetLike {
  playOrPause: () => void;
  seek: () => void;
  setVolumeLevel: () => void;
  muteOrUnmute: () => void;
}

interface ChromeCastLike {
  AutoJoinPolicy: Record<string, string>;
  media: {
    MediaInfo: new (
      contentId: string,
      contentType: string,
    ) => {
      metadata?: unknown;
      duration?: number;
    };
    MusicTrackMediaMetadata: new () => {
      title?: string;
      artist?: string;
      albumName?: string;
      images?: unknown[];
    };
    LoadRequest: new (mediaInfo: unknown) => {
      autoplay?: boolean;
      currentTime?: number;
    };
  };
  Image: new (url: string) => unknown;
}

interface CastWindow extends Window {
  __onGCastApiAvailable?: (available: boolean) => void;
  cast?: {
    framework: {
      CastContext: { getInstance: () => CastContextLike };
      CastState: Record<string, string>;
      CastContextEventType: Record<string, string>;
      RemotePlayerEventType: Record<string, string>;
      RemotePlayer: new () => RemotePlayerLike;
      RemotePlayerController: new (
        player: RemotePlayerLike,
      ) => RemoteControllerLike;
    };
  };
  chrome?: { cast?: ChromeCastLike };
}

const initialSnapshot: CastSnapshot = {
  availability: "idle",
  connection: "disconnected",
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  volume: 0.8,
  muted: false,
  contentId: null,
};

function isSupportedBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/i.test(userAgent);
  const isElectron = /Electron/i.test(userAgent);
  const isChromium = /Chrome|Chromium|Edg\//i.test(userAgent);
  return isChromium && !isIos && !isElectron && window.isSecureContext;
}

function inferMimeType(track: CastTrack): string {
  if (track.mimeType) return track.mimeType;
  const pathname = new URL(
    track.url,
    window.location.href,
  ).pathname.toLowerCase();
  if (pathname.endsWith(".wav")) return "audio/wav";
  if (pathname.endsWith(".flac")) return "audio/flac";
  if (pathname.endsWith(".m4a") || pathname.endsWith(".aac")) {
    return "audio/mp4";
  }
  if (pathname.endsWith(".ogg")) return "audio/ogg";
  return "audio/mpeg";
}

class GoogleCastService {
  private snapshot: CastSnapshot = initialSnapshot;
  private listeners = new Set<Listener>();
  private endedListeners = new Set<() => void>();
  private initializePromise: Promise<boolean> | null = null;
  private context: CastContextLike | null = null;
  private remotePlayer: RemotePlayerLike | null = null;
  private remoteController: RemoteControllerLike | null = null;
  private lastPlayerState: string | undefined;

  getSnapshot = (): CastSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  onEnded = (listener: () => void): (() => void) => {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  };

  private update(patch: Partial<CastSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }

  async initialize(): Promise<boolean> {
    if (this.initializePromise) return this.initializePromise;
    this.initializePromise = this.initializeInternal();
    return this.initializePromise;
  }

  private async initializeInternal(): Promise<boolean> {
    const receiverApplicationId =
      import.meta.env.VITE_CAST_RECEIVER_APP_ID?.trim();
    if (!receiverApplicationId || !isSupportedBrowser()) {
      this.update({ availability: "unsupported" });
      return false;
    }

    this.update({ availability: "loading" });
    const castWindow = window as CastWindow;
    const available = await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const previous = castWindow.__onGCastApiAvailable;
      castWindow.__onGCastApiAvailable = (value) => {
        previous?.(value);
        finish(value);
      };
      if (castWindow.cast?.framework && castWindow.chrome?.cast) {
        finish(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${CAST_SENDER_URL}"]`,
      );
      if (existing) {
        existing.addEventListener("error", () => finish(false), { once: true });
      } else {
        const script = document.createElement("script");
        script.src = CAST_SENDER_URL;
        script.async = true;
        script.onerror = () => finish(false);
        document.head.appendChild(script);
      }
      window.setTimeout(() => finish(false), 10_000);
    });

    if (!available) {
      this.update({ availability: "unsupported" });
      return false;
    }

    const framework = castWindow.cast?.framework;
    const chromeCast = castWindow.chrome?.cast;
    if (!framework || !chromeCast) {
      this.update({ availability: "unsupported" });
      return false;
    }

    this.context = framework.CastContext.getInstance();
    this.context.setOptions({
      receiverApplicationId,
      autoJoinPolicy: chromeCast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
    this.remotePlayer = new framework.RemotePlayer();
    this.remoteController = new framework.RemotePlayerController(
      this.remotePlayer,
    );

    const contextEvents = framework.CastContextEventType;
    this.context.addEventListener(contextEvents.CAST_STATE_CHANGED, () => {
      const state = this.context?.getCastState?.();
      const castStates = framework.CastState;
      if (state === castStates.CONNECTED) {
        this.update({ availability: "available", connection: "connected" });
      } else if (state === castStates.CONNECTING) {
        this.update({ availability: "available", connection: "connecting" });
      } else if (state === castStates.NO_DEVICES_AVAILABLE) {
        this.update({ availability: "no-devices", connection: "disconnected" });
      } else {
        this.update({ availability: "available", connection: "disconnected" });
      }
    });

    const remoteEvents = framework.RemotePlayerEventType;
    const syncRemote = () => this.syncRemoteSnapshot();
    [
      remoteEvents.IS_PAUSED_CHANGED,
      remoteEvents.CURRENT_TIME_CHANGED,
      remoteEvents.DURATION_CHANGED,
      remoteEvents.VOLUME_LEVEL_CHANGED,
      remoteEvents.IS_MUTED_CHANGED,
      remoteEvents.MEDIA_INFO_CHANGED,
      remoteEvents.PLAYER_STATE_CHANGED,
    ].forEach((eventType) => {
      if (eventType)
        this.remoteController?.addEventListener(eventType, syncRemote);
    });

    const initialState = this.context.getCastState?.();
    const initialAvailability =
      initialState === framework.CastState.NO_DEVICES_AVAILABLE
        ? "no-devices"
        : "available";
    this.update({ availability: initialAvailability });
    return true;
  }

  private syncRemoteSnapshot() {
    const player = this.remotePlayer;
    if (!player) return;
    const previousPlayerState = this.lastPlayerState;
    this.lastPlayerState = player.playerState;
    this.update({
      isPlaying: !player.isPaused,
      positionMs: Math.max(0, Math.round((player.currentTime || 0) * 1000)),
      durationMs: Math.max(0, Math.round((player.duration || 0) * 1000)),
      volume: Math.min(1, Math.max(0, player.volumeLevel ?? 0.8)),
      muted: Boolean(player.isMuted),
      contentId: player.mediaInfo?.contentId ?? null,
    });
    if (
      previousPlayerState &&
      previousPlayerState !== "IDLE" &&
      player.playerState === "IDLE" &&
      player.idleReason === "FINISHED"
    ) {
      this.endedListeners.forEach((listener) => listener());
    }
  }

  async requestSession(): Promise<void> {
    if (!(await this.initialize()) || !this.context) {
      throw new Error("Google Cast no está disponible en este navegador.");
    }
    this.update({ connection: "connecting" });
    try {
      await this.context.requestSession();
      this.update({ availability: "available", connection: "connected" });
      this.syncRemoteSnapshot();
    } catch (error) {
      this.update({ connection: "disconnected" });
      throw error;
    }
  }

  disconnect(): void {
    this.context?.endCurrentSession(true);
    this.update({ connection: "disconnected", isPlaying: false });
  }

  async loadTrack(
    track: CastTrack,
    positionMs = 0,
    autoplay = true,
  ): Promise<void> {
    const castWindow = window as CastWindow;
    const session = this.context?.getCurrentSession();
    const chromeCast = castWindow.chrome?.cast;
    if (!session || !chromeCast)
      throw new Error("No hay una sesión Cast activa.");

    const contentUrl = new URL(track.url, window.location.href);
    if (contentUrl.protocol !== "https:") {
      throw new Error(
        "Google Cast requiere una URL pública HTTPS para el audio.",
      );
    }
    const mediaInfo = new chromeCast.media.MediaInfo(
      contentUrl.toString(),
      inferMimeType(track),
    );
    const metadata = new chromeCast.media.MusicTrackMediaMetadata();
    metadata.title = track.title;
    metadata.artist = track.artist;
    metadata.albumName = track.album ?? undefined;
    if (track.cover) {
      const coverUrl = new URL(track.cover, window.location.href);
      if (coverUrl.protocol === "https:") {
        metadata.images = [new chromeCast.Image(coverUrl.toString())];
      }
    }
    mediaInfo.metadata = metadata;
    mediaInfo.duration = Math.max(0, track.durationMs / 1000);
    const request = new chromeCast.media.LoadRequest(mediaInfo);
    request.autoplay = autoplay;
    request.currentTime = Math.max(0, positionMs / 1000);
    await session.loadMedia(request);
    this.syncRemoteSnapshot();
  }

  togglePlay(): void {
    this.remoteController?.playOrPause();
  }

  play(): void {
    if (!this.snapshot.isPlaying) this.remoteController?.playOrPause();
  }

  pause(): void {
    if (this.snapshot.isPlaying) this.remoteController?.playOrPause();
  }

  seek(positionMs: number): void {
    if (!this.remotePlayer || !this.remoteController) return;
    this.remotePlayer.currentTime = Math.max(0, positionMs / 1000);
    this.remoteController.seek();
    this.update({ positionMs: Math.max(0, positionMs) });
  }

  setVolume(volume: number): void {
    if (!this.remotePlayer || !this.remoteController) return;
    this.remotePlayer.volumeLevel = Math.min(1, Math.max(0, volume));
    this.remoteController.setVolumeLevel();
  }

  toggleMute(): void {
    this.remoteController?.muteOrUnmute();
  }
}

export const googleCast = new GoogleCastService();
