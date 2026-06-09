import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTracks, type Track } from "../api/tracks";

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 6;

interface GlobalSearchState {
  /** Live input — debounced before hitting the backend. */
  setQuery: (q: string) => void;
  query: string;
  /** Tracks matching the latest debounced query, or `[]` when query is empty. */
  results: Track[];
  isLoading: boolean;
}

/**
 * Cross-catalog typeahead used by the navbar. Hits the same
 * /library/tracks?search= endpoint that the library page does — the backend
 * already filters title/artist/album insensitively and unions the user's own
 * uploads with public catalog tracks.
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
    queryFn: () => listTracks({ search: debounced, take: RESULT_LIMIT }),
    enabled,
    staleTime: 30_000,
  });

  return {
    query,
    setQuery,
    results: enabled ? (q.data?.tracks ?? []) : [],
    isLoading: enabled && q.isLoading,
  };
}
