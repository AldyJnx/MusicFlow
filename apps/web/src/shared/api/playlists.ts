import { api } from "./client";
import type { Track } from "./tracks";

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string;
  coverArt: string | null;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tracks: number };
}

/** A track inside a playlist, carrying its order position. */
export interface PlaylistTrackEntry {
  position: number;
  track: Track;
}

/** Full playlist payload returned by GET /library/playlists/:id. */
export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrackEntry[];
}

export async function listPlaylists(): Promise<Playlist[]> {
  const { data } = await api.get<Playlist[]>("/library/playlists");
  return data;
}

export async function createPlaylist(payload: {
  name: string;
  description?: string;
}): Promise<Playlist> {
  const { data } = await api.post<Playlist>("/library/playlists", payload);
  return data;
}

export async function deletePlaylist(id: string): Promise<void> {
  await api.delete(`/library/playlists/${id}`);
}

export async function getPlaylist(id: string): Promise<PlaylistWithTracks> {
  const { data } = await api.get<PlaylistWithTracks>(
    `/library/playlists/${id}`,
  );
  return data;
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  await api.post(`/library/playlists/${playlistId}/tracks`, { trackId });
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  await api.delete(`/library/playlists/${playlistId}/tracks/${trackId}`);
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<void> {
  await api.patch(`/library/playlists/${playlistId}/tracks/reorder`, {
    trackIds,
  });
}
