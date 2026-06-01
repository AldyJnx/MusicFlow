import { api } from "./client";

export type TrackSource = "LOCAL" | "SYNCED" | "BOTH";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";

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
  source: TrackSource;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
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
  const { data } = await api.get<TracksListResponse>("/tracks", { params });
  return data;
}

export async function listArtists(): Promise<string[]> {
  const { data } = await api.get<string[]>("/tracks/artists");
  return data;
}

export async function listAlbums(artist?: string): Promise<Album[]> {
  const { data } = await api.get<Album[]>("/tracks/albums", {
    params: artist ? { artist } : undefined,
  });
  return data;
}

export async function listGenres(): Promise<string[]> {
  const { data } = await api.get<string[]>("/tracks/genres");
  return data;
}
