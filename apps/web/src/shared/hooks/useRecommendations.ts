import { useQuery } from "@tanstack/react-query";

import { getHomeRecommendations } from "../api/recommendations";

export const recommendationKeys = {
  home: (limit: number) => ["recommendations", "home", limit] as const,
};

export function useHomeRecommendationsQuery(limit = 6) {
  return useQuery({
    queryKey: recommendationKeys.home(limit),
    queryFn: () => getHomeRecommendations(limit),
    // The backend keeps this result in Redis for ten minutes. Mirroring that
    // TTL avoids redundant requests and preserves stable Home suggestions.
    staleTime: 10 * 60_000,
  });
}
