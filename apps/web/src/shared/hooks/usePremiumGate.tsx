import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import { useAuthStore } from "../stores/authStore";

export type PremiumFeature = "ai" | "segments";

type GateContext = {
  isPremium: boolean;
  /**
   * Run `action` only when the user is premium. When they're free, open
   * the upgrade modal and skip the action.
   * @returns true when the action ran, false when the modal opened instead.
   */
  guard: (feature: PremiumFeature, action?: () => void) => boolean;
  /** Open the upgrade modal directly — used by feature cards that *show*
   * a CTA instead of triggering an action. */
  openUpgrade: (feature: PremiumFeature) => void;
  /** Close the upgrade modal. */
  closeUpgrade: () => void;
  /** Which feature, if any, currently has the modal open. */
  activeFeature: PremiumFeature | null;
  /** True while the modal is open. */
  isModalOpen: boolean;
};

const PremiumGateContext = createContext<GateContext | null>(null);

export function PremiumGateProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isPremium = !!user?.isPremium;
  const [activeFeature, setActiveFeature] = useState<PremiumFeature | null>(
    null,
  );

  const openUpgrade = useCallback((feature: PremiumFeature) => {
    setActiveFeature(feature);
  }, []);

  const closeUpgrade = useCallback(() => {
    setActiveFeature(null);
  }, []);

  const guard = useCallback(
    (feature: PremiumFeature, action?: () => void) => {
      if (isPremium) {
        action?.();
        return true;
      }
      setActiveFeature(feature);
      return false;
    },
    [isPremium],
  );

  return (
    <PremiumGateContext.Provider
      value={{
        isPremium,
        guard,
        openUpgrade,
        closeUpgrade,
        activeFeature,
        isModalOpen: activeFeature !== null,
      }}
    >
      {children}
    </PremiumGateContext.Provider>
  );
}

export function usePremiumGate(): GateContext {
  const ctx = useContext(PremiumGateContext);
  if (!ctx) {
    throw new Error("usePremiumGate must be used inside <PremiumGateProvider>");
  }
  return ctx;
}
