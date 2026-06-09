import { api } from "./client";
import type { TracksListResponse } from "./tracks";

export interface SaveResult {
  trackId: string;
  savedAt: string;
  /** True when the track is "saved" because the user owns it. */
  implicit: boolean;
}

export async function listSavedTracks(params?: {
  search?: string;
  skip?: number;
  take?: number;
}): Promise<TracksListResponse> {
  const { data } = await api.get<TracksListResponse>("/library/saves", {
    params,
  });
  return data;
}

export async function saveTrack(trackId: string): Promise<SaveResult> {
  const { data } = await api.post<SaveResult>(`/library/saves/${trackId}`);
  return data;
}

export async function unsaveTrack(trackId: string): Promise<void> {
  await api.delete(`/library/saves/${trackId}`);
}

export async function checkSavedTracks(trackIds: string[]): Promise<string[]> {
  if (trackIds.length === 0) return [];
  const { data } = await api.post<{ savedTrackIds: string[] }>(
    "/library/saves/check",
    { trackIds },
  );
  return data.savedTrackIds;
}
