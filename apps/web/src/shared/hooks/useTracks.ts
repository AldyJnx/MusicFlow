import { useQuery } from "@tanstack/react-query";
import {
  listTracks,
  listArtists,
  listAlbums,
  listGenres,
  type ListTracksParams,
} from "../api/tracks";

export const trackKeys = {
  all: ["tracks"] as const,
  lists: () => [...trackKeys.all, "list"] as const,
  list: (params?: ListTracksParams) =>
    [...trackKeys.lists(), params ?? {}] as const,
  artists: () => [...trackKeys.all, "artists"] as const,
  albums: (artist?: string) =>
    [...trackKeys.all, "albums", artist ?? ""] as const,
  genres: () => [...trackKeys.all, "genres"] as const,
};

export function useTracksQuery(
  params?: ListTracksParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: trackKeys.list(params),
    queryFn: () => listTracks(params),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useArtistsQuery() {
  return useQuery({
    queryKey: trackKeys.artists(),
    queryFn: listArtists,
    staleTime: 60_000,
  });
}

export function useAlbumsQuery(artist?: string) {
  return useQuery({
    queryKey: trackKeys.albums(artist),
    queryFn: () => listAlbums(artist),
    staleTime: 60_000,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: trackKeys.genres(),
    queryFn: listGenres,
    staleTime: 60_000,
  });
}
