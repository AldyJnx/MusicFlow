import { api } from "./client";

export interface QuotaSlice {
  used: number;
  /** `null` means unlimited (premium). */
  limit: number | null;
  /** `null` means unlimited (premium). */
  remaining: number | null;
  resetAt?: string;
}

export interface BillingQuota {
  isPremium: boolean;
  uploads: QuotaSlice;
  aiRequests: QuotaSlice;
  customPresets: QuotaSlice;
}

export async function getBillingQuota(): Promise<BillingQuota> {
  const { data } = await api.get<BillingQuota>("/billing/quota");
  return data;
}
