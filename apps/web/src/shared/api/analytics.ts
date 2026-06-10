import { api } from "./client";
import type { Track } from "./tracks";

export type PlayDevice = "DESKTOP" | "WEB" | "MOBILE" | "AUTO";
export type StatsPeriod = "DAY" | "WEEK" | "MONTH" | "ALL_TIME";

export interface RecordPlayPayload {
  trackId: string;
  durationListenedMs: number;
  completed: boolean;
  skipped: boolean;
  device: PlayDevice;
  eqConfigUsedId?: string;
}

export interface MostPlayedTrack extends Track {
  playCount: number;
}

export interface ListeningStats {
  totalPlays: number;
  /** Cached stats serialize BigInt as a string; coerce with Number(). */
  totalTimeMs: number | string;
  uniqueTracks: number;
  uniqueArtists: number;
  topTracks: Array<{
    id: string;
    count: number;
    title: string;
    artist: string;
  }>;
  topArtists: Array<{ name: string; count: number }>;
  topAlbums: Array<{ name: string; count: number }>;
}

export async function recordPlay(payload: RecordPlayPayload): Promise<void> {
  await api.post("/analytics/play", payload);
}

export async function getRecentlyPlayed(limit = 20): Promise<Track[]> {
  const { data } = await api.get<Track[]>("/analytics/recently-played", {
    params: { limit },
  });
  return data;
}

export async function getMostPlayed(limit = 20): Promise<MostPlayedTrack[]> {
  const { data } = await api.get<MostPlayedTrack[]>("/analytics/most-played", {
    params: { limit },
  });
  return data;
}

export async function getStats(
  period: StatsPeriod = "ALL_TIME",
): Promise<ListeningStats> {
  const { data } = await api.get<ListeningStats>("/analytics/stats", {
    params: { period },
  });
  return data;
}
