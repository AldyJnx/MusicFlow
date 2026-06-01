import { api } from "./client";

// ─── String union types (no enums — erasableSyntaxOnly) ───────────────────────

export type SegmentCreatedBy = "MANUAL" | "AI";

export type ReverbPresetSeg =
  | "NONE"
  | "SMALL_ROOM"
  | "MEDIUM_ROOM"
  | "LARGE_ROOM"
  | "SMALL_HALL"
  | "LARGE_HALL"
  | "CATHEDRAL"
  | "PLATE"
  | "SPRING";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EQConfigEmbed {
  id: string;
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPresetSeg;
  reverbAmount: number;
}

export interface EQSegment {
  id: string;
  trackId: string;
  userId: string;
  eqConfigId: string;
  label: string | null;
  startMs: number;
  endMs: number;
  transitionMs: number;
  createdBy: SegmentCreatedBy;
  aiRequestId: string | null;
  createdAt: string;
  updatedAt: string;
  eqConfig: EQConfigEmbed;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface SegmentEQConfigPayload {
  presetId?: string;
  bands?: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudness?: number;
  reverbPreset?: ReverbPresetSeg;
  reverbAmount?: number;
}

/**
 * Matches CreateSegmentDto exactly:
 * trackId, startMs, endMs are required; eqConfig nested object is required.
 * label, transitionMs, createdBy, aiRequestId are optional.
 */
export interface CreateSegmentPayload {
  trackId: string;
  startMs: number;
  endMs: number;
  label?: string;
  transitionMs?: number;
  createdBy?: SegmentCreatedBy;
  aiRequestId?: string;
  eqConfig: SegmentEQConfigPayload;
}

export interface UpdateSegmentPayload {
  label?: string;
  startMs?: number;
  endMs?: number;
  transitionMs?: number;
  eqConfig?: SegmentEQConfigPayload;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function listSegments(trackId: string): Promise<EQSegment[]> {
  const { data } = await api.get<EQSegment[]>(`/equalizer/segments/${trackId}`);
  return data;
}

export async function getActiveSegment(
  trackId: string,
  positionMs: number,
): Promise<EQSegment | null> {
  const { data } = await api.get<EQSegment | null>(
    `/equalizer/segments/${trackId}/active`,
    { params: { position: positionMs } },
  );
  return data;
}

export async function createSegment(
  payload: CreateSegmentPayload,
): Promise<EQSegment> {
  const { data } = await api.post<EQSegment>("/equalizer/segments", payload);
  return data;
}

export async function updateSegment(
  id: string,
  payload: UpdateSegmentPayload,
): Promise<EQSegment> {
  const { data } = await api.patch<EQSegment>(
    `/equalizer/segments/${id}`,
    payload,
  );
  return data;
}

export async function deleteSegment(id: string): Promise<void> {
  await api.delete(`/equalizer/segments/${id}`);
}
