import { api } from "./client";

export type TrackSource = "LOCAL" | "SYNCED" | "BOTH";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";

/** Backend-computed waveform peaks. Optional — older tracks may not have them. */
export interface TrackPeaks {
  v: 1;
  n: number;
  channels: number;
  sampleRate: number;
  /** Normalized -1..1 max-per-bucket, mono mix. */
  peaks: number[];
}

export interface Track {
  id: string;
  userId: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  durationMs: number;
  coverArt: string | null;
  fileUrlRemote: string | null;
  /** True when the track belongs to the public catalog (Spotify-style). */
  isCatalog: boolean;
  source: TrackSource;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  peaks?: TrackPeaks | null;
}

export interface TracksListResponse {
  tracks: Track[];
  total: number;
  skip: number;
  take: number;
}

export interface Album {
  album: string;
  albumArtist: string | null;
  coverArt: string | null;
}

export interface ListTracksParams {
  search?: string;
  artist?: string;
  album?: string;
  genre?: string;
  skip?: number;
  take?: number;
}

export async function listTracks(
  params?: ListTracksParams,
): Promise<TracksListResponse> {
  const { data } = await api.get<TracksListResponse>("/library/tracks", {
    params,
  });
  return data;
}

export async function listArtists(): Promise<string[]> {
  const { data } = await api.get<string[]>("/library/tracks/artists");
  return data;
}

export async function listAlbums(artist?: string): Promise<Album[]> {
  const { data } = await api.get<Album[]>("/library/tracks/albums", {
    params: artist ? { artist } : undefined,
  });
  return data;
}

export async function listGenres(): Promise<string[]> {
  const { data } = await api.get<string[]>("/library/tracks/genres");
  return data;
}

export interface TrackLyrics {
  trackId: string;
  /** Raw .lrc payload with [mm:ss.xx] markers. Present when admin uploaded a synced file. */
  lrc: string | null;
  /** Plain-text fallback. */
  text: string | null;
  hasLyrics: boolean;
}

export async function getTrackLyrics(trackId: string): Promise<TrackLyrics> {
  const { data } = await api.get<TrackLyrics>(
    `/library/tracks/${trackId}/lyrics`,
  );
  return data;
}

export async function updateTrackLyrics(
  trackId: string,
  payload: { lyricsLrc?: string | null; lyricsText?: string | null },
): Promise<void> {
  await api.patch(`/library/tracks/${trackId}`, payload);
}

/**
 * Upload a local audio file. The backend dedupes by SHA-256 (409 on dup),
 * extracts metadata, stores in R2 and returns the Track. Counts toward the
 * free-tier upload quota; a 403 with QUOTA_UPLOADS_EXCEEDED triggers the
 * upsell modal via the axios interceptor.
 */
export async function uploadTrack(
  file: File,
  overrides?: { title?: string; artist?: string; album?: string },
): Promise<Track> {
  const form = new FormData();
  form.append("file", file);
  if (overrides?.title) form.append("title", overrides.title);
  if (overrides?.artist) form.append("artist", overrides.artist);
  if (overrides?.album) form.append("album", overrides.album);
  const { data } = await api.post<Track>("/library/tracks/upload", form);
  return data;
}
