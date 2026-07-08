import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  listTracks,
  listArtists,
  listAlbums,
  listGenres,
  type ListTracksParams,
} from "../api/tracks";

/** Page size for infinite/paginated track lists. */
export const TRACKS_PAGE_SIZE = 30;

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

// The public catalog (tracks/artists/albums/genres) is admin-curated and barely
// changes during a session, so we keep it fresh for minutes rather than seconds
// to avoid re-fetching on every navigation, and keep it cached a while longer.
const CATALOG_STALE_TIME = 10 * 60_000; // 10 min
const CATALOG_GC_TIME = 15 * 60_000; // 15 min

export function useTracksQuery(
  params?: ListTracksParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: trackKeys.list(params),
    queryFn: () => listTracks(params),
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
    enabled: options?.enabled ?? true,
  });
}

export function useArtistsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: trackKeys.artists(),
    queryFn: listArtists,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
    enabled: options?.enabled ?? true,
  });
}

export function useAlbumsQuery(
  artist?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: trackKeys.albums(artist),
    queryFn: () => listAlbums(artist),
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
    enabled: options?.enabled ?? true,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: trackKeys.genres(),
    queryFn: listGenres,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
}

/**
 * Paginated catalog list via infinite scroll. Loads `TRACKS_PAGE_SIZE` rows per
 * page and exposes `fetchNextPage`/`hasNextPage` so the UI only pulls (and
 * renders) what the user actually scrolls to — this keeps the first paint fast
 * and scales as the catalog grows.
 */
export function useInfiniteTracksQuery(
  params?: Omit<ListTracksParams, "skip" | "take">,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: [...trackKeys.list(params), "infinite"] as const,
    queryFn: ({ pageParam }) =>
      listTracks({ ...params, skip: pageParam, take: TRACKS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.skip + lastPage.tracks.length;
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
    enabled: options?.enabled ?? true,
  });
}
