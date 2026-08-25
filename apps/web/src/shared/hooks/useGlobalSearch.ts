import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTracks, type Track } from "../api/tracks";
import { searchCatalogArtists, type CatalogArtist } from "../api/catalog";

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 6;

interface GlobalSearchState {
  /** Live input — debounced before hitting the backend. */
  setQuery: (q: string) => void;
  query: string;
  /** Tracks matching the latest debounced query, or `[]` when query is empty. */
  tracks: Track[];
  /** Artist profiles matching the same query. */
  artists: CatalogArtist[];
  isLoading: boolean;
}

/**
 * Cross-catalog typeahead used by the navbar. Tracks and catalog artists are
 * requested together so a search such as "Bruno Mars" exposes the profile as
 * well as matching songs without a serial request waterfall.
 */
export function useGlobalSearch(): GlobalSearchState {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setDebounced("");
      return;
    }
    const id = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const enabled = debounced.length >= 2;

  const q = useQuery({
    queryKey: ["globalSearch", debounced],
    queryFn: async () => {
      const [trackResponse, artistResponse] = await Promise.all([
        listTracks({ search: debounced, take: RESULT_LIMIT }),
        searchCatalogArtists(debounced, RESULT_LIMIT),
      ]);
      return { tracks: trackResponse.tracks, artists: artistResponse.items };
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    query,
    setQuery,
    tracks: enabled ? (q.data?.tracks ?? []) : [],
    artists: enabled ? (q.data?.artists ?? []) : [],
    isLoading: enabled && q.isLoading,
  };
}
