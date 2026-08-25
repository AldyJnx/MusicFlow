import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  listTracks,
  listArtists,
  listArtistsPage,
  listAlbums,
  listAlbumsPage,
  listGenres,
  type ListTracksParams,
} from "../api/tracks";

export const trackKeys = {
  all: ["tracks"] as const,
  lists: () => [...trackKeys.all, "list"] as const,
  list: (params?: ListTracksParams) =>
    [...trackKeys.lists(), params ?? {}] as const,
  artists: () => [...trackKeys.all, "artists"] as const,
  artistsPage: (query: string) =>
    [...trackKeys.all, "artists", "page", query] as const,
  albums: (artist?: string) =>
    [...trackKeys.all, "albums", artist ?? ""] as const,
  albumsPage: (query: string) =>
    [...trackKeys.all, "albums", "page", query] as const,
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

const LIBRARY_PAGE_SIZE = 6;

export function useArtistsInfiniteQuery(
  query: string,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: trackKeys.artistsPage(query),
    queryFn: ({ pageParam }) =>
      listArtistsPage({
        q: query || undefined,
        offset: pageParam,
        limit: LIBRARY_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 2 * 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useAlbumsInfiniteQuery(
  query: string,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: trackKeys.albumsPage(query),
    queryFn: ({ pageParam }) =>
      listAlbumsPage({
        q: query || undefined,
        offset: pageParam,
        limit: LIBRARY_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 2 * 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: trackKeys.genres(),
    queryFn: listGenres,
    staleTime: 60_000,
  });
}
