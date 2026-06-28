import { api } from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export type AppliedTo = "GLOBAL" | "PLAYLIST" | "TRACK" | "SEGMENT";

export type Feedback = "GOOD" | "BAD" | "NEUTRAL";

export type ReverbPreset =
  | "NONE"
  | "SMALL_ROOM"
  | "MEDIUM_ROOM"
  | "LARGE_ROOM"
  | "SMALL_HALL"
  | "LARGE_HALL"
  | "CATHEDRAL"
  | "PLATE"
  | "SPRING";

export interface SuggestedSegment {
  label: string;
  startMs: number;
  endMs: number;
  bands: number[];
  explanation: string;
}

export interface EQSuggestion {
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
  explanation: string;
  segments?: SuggestedSegment[];
}

export interface AISuggestResponse {
  suggestion: EQSuggestion;
  requestId: string;
}

export type AssistantIntent = "eq" | "recommend" | "reply";

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string | null;
  coverArt: string | null;
  durationMs: number;
  fileUrlRemote: string | null;
}

export interface AssistantResponse {
  requestId: string;
  intent: AssistantIntent;
  message: string;
  eq?: EQSuggestion;
  tracks?: RecommendedTrack[];
  genres?: string[];
}

export interface AIRequest {
  id: string;
  prompt: string;
  suggestion: EQSuggestion;
  appliedTo?: AppliedTo;
  appliedId?: string;
  feedback?: Feedback;
  comment?: string;
  createdAt: string;
}

export interface AIRequestHistory {
  requests: AIRequest[];
  total: number;
  skip: number;
  take: number;
}

// ── API Functions ──────────────────────────────────────────────────────────

export async function suggestEQ(payload: {
  prompt: string;
  trackId?: string;
  playlistId?: string;
  context?: object;
}): Promise<AISuggestResponse> {
  const { data } = await api.post<AISuggestResponse>("/ai/suggest", payload);
  return data;
}

/**
 * The flexible assistant: interprets a free-form request and returns either an
 * EQ tweak, music recommendations from the user's catalog (personalized to
 * their taste), or a plain reply. Stays scoped to music + the app.
 */
export async function assist(payload: {
  prompt: string;
  trackId?: string;
}): Promise<AssistantResponse> {
  const { data } = await api.post<AssistantResponse>("/ai/assistant", payload);
  return data;
}

export async function acceptSuggestion(
  requestId: string,
  appliedTo: AppliedTo,
  appliedId?: string,
): Promise<AIRequest> {
  const { data } = await api.post<AIRequest>(`/ai/${requestId}/accept`, {
    appliedTo,
    ...(appliedId !== undefined ? { appliedId } : {}),
  });
  return data;
}

export async function provideFeedback(
  requestId: string,
  feedback: Feedback,
  comment?: string,
): Promise<AIRequest> {
  const { data } = await api.post<AIRequest>(`/ai/${requestId}/feedback`, {
    feedback,
    ...(comment !== undefined ? { comment } : {}),
  });
  return data;
}

export async function getHistory(params?: {
  skip?: number;
  take?: number;
}): Promise<AIRequestHistory> {
  const { data } = await api.get<AIRequestHistory>("/ai/history", {
    params,
  });
  return data;
}

export interface DetectSegmentsResponse {
  segments: unknown[];
  count: number;
  requestId: string;
}

/**
 * Ask the AI to split a track into EQ segments and persist them. The track
 * must have no existing segments (the backend refuses otherwise).
 */
export async function detectSegments(
  trackId: string,
): Promise<DetectSegmentsResponse> {
  const { data } = await api.post<DetectSegmentsResponse>(
    "/ai/detect-segments",
    { trackId },
  );
  return data;
}
