import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkSavedTracks,
  getLatestSavedCover,
  listSavedTracks,
  saveTrack,
  unsaveTrack,
} from "../api/library-saves";
import { trackKeys } from "./useTracks";

export const savesKeys = {
  all: ["library", "saves"] as const,
  list: (params?: { search?: string }) =>
    [...savesKeys.all, "list", params ?? {}] as const,
  check: (trackIds: string[]) =>
    [...savesKeys.all, "check", [...trackIds].sort().join(",")] as const,
  latestCover: () => [...savesKeys.all, "latest-cover"] as const,
};

export function useLatestSavedCoverQuery() {
  return useQuery({
    queryKey: savesKeys.latestCover(),
    queryFn: getLatestSavedCover,
    staleTime: 30_000,
  });
}

export function useSavedTracksQuery(params?: {
  search?: string;
  skip?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: savesKeys.list(params),
    queryFn: () => listSavedTracks(params),
    staleTime: 30_000,
  });
}

/**
 * Bulk-lookup which tracks in a list the user has saved. Used by the catalog
 * to paint heart icons in a single round-trip.
 */
export function useSavedCheckQuery(trackIds: string[]) {
  return useQuery({
    queryKey: savesKeys.check(trackIds),
    queryFn: () => checkSavedTracks(trackIds),
    staleTime: 30_000,
    enabled: trackIds.length > 0,
  });
}

/**
 * Optimistic toggle. Updates the cached "saved set" immediately and rolls
 * back if the request fails. Invalidates the saved list and tracks list so
 * the "My Library" tab reflects the change.
 */
export function useToggleSave() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      saved,
    }: {
      trackId: string;
      saved: boolean;
    }) => {
      if (saved) await unsaveTrack(trackId);
      else await saveTrack(trackId);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: savesKeys.all });
      void qc.invalidateQueries({ queryKey: trackKeys.all });
    },
  });
}
