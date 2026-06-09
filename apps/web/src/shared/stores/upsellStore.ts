import { create } from "zustand";

export type UpsellReason =
  | "PREMIUM_REQUIRED"
  | "QUOTA_UPLOADS_EXCEEDED"
  | "QUOTA_AI_EXCEEDED"
  | "QUOTA_PRESETS_EXCEEDED";

export interface UpsellPayload {
  reason: UpsellReason;
  message?: string;
  quota?: {
    used: number;
    limit: number | null;
    remaining: number | null;
    resetAt?: string;
  };
}

interface UpsellState {
  open: boolean;
  payload: UpsellPayload | null;
  show: (payload: UpsellPayload) => void;
  close: () => void;
}

export const useUpsellStore = create<UpsellState>((set) => ({
  open: false,
  payload: null,
  show: (payload) => set({ open: true, payload }),
  close: () => set({ open: false, payload: null }),
}));
