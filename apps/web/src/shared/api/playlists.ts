import { api } from "./client";

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
