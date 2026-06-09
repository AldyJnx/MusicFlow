import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBillingQuota } from "../api/billing";

export const quotaKeys = {
  all: ["billing", "quota"] as const,
};

export function useQuotaQuery() {
  return useQuery({
    queryKey: quotaKeys.all,
    queryFn: getBillingQuota,
    staleTime: 30_000,
  });
}

/**
 * Invalidate the quota query after an action that consumes quota
 * (upload, AI request, preset create). Call this from mutation onSuccess.
 */
export function useInvalidateQuota() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: quotaKeys.all });
}
