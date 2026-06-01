import { api } from "./client";

// ─── String union types (no enums — erasableSyntaxOnly) ───────────────────────

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

export type EQScopeType = "GLOBAL" | "PLAYLIST" | "TRACK";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EQPreset {
  id: string;
  userId: string;
  name: string;
  isGlobal: boolean;
  bands: number[]; // length 10
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
}

export interface EQConfig {
  id: string;
  scopeType: EQScopeType;
  scopeId: string | null;
  presetId: string | null;
  bands: number[]; // length 10
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreatePresetPayload {
  name: string;
  bands: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudness?: number;
  reverbPreset?: ReverbPreset;
  reverbAmount?: number;
}

export interface UpsertConfigPayload {
  scopeType: EQScopeType;
  scopeId?: string;
  presetId?: string;
  bands?: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudness?: number;
  reverbPreset?: ReverbPreset;
  reverbAmount?: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function listPresets(): Promise<EQPreset[]> {
  const { data } = await api.get<EQPreset[]>("/equalizer/presets");
  return data;
}

export async function createPreset(
  payload: CreatePresetPayload,
): Promise<EQPreset> {
  const { data } = await api.post<EQPreset>("/equalizer/presets", payload);
  return data;
}

export async function upsertConfig(
  payload: UpsertConfigPayload,
): Promise<EQConfig> {
  const { data } = await api.post<EQConfig>("/equalizer/configs", payload);
  return data;
}

export async function resolveConfig(
  trackId: string,
  playlistId?: string,
): Promise<EQConfig | null> {
  const params = playlistId ? { playlistId } : undefined;
  const { data } = await api.get<EQConfig | null>(
    `/equalizer/configs/resolve/${trackId}`,
    { params },
  );
  return data;
}

export async function getConfigByScope(
  scopeType: EQScopeType,
  scopeId?: string,
): Promise<EQConfig | null> {
  const params: Record<string, string> = { scopeType };
  if (scopeId !== undefined) params.scopeId = scopeId;
  const { data } = await api.get<EQConfig | null>("/equalizer/configs", {
    params,
  });
  return data;
}
