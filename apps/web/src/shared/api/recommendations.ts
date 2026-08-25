import { api } from "./client";
import type { Track } from "./tracks";

export interface RecommendedTrack extends Track {
  recommendationReason: string;
}

export interface HomeRecommendations {
  tracks: RecommendedTrack[];
  generatedAt: string;
}

export async function getHomeRecommendations(
  limit = 6,
): Promise<HomeRecommendations> {
  const { data } = await api.get<HomeRecommendations>("/recommendations/home", {
    params: { limit },
  });
  return data;
}
