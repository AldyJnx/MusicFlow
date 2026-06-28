import { Crown, ShieldCheck, User } from "lucide-react";

import { useAuthStore } from "../stores/authStore";

/**
 * A small, always-visible chip showing the signed-in user's tier so the
 * distinction between Admin, Premium and Free is obvious across the app.
 */
export default function TierBadge({ className = "" }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const tier =
    user.role === "ADMIN"
      ? {
          label: "Admin",
          Icon: ShieldCheck,
          cls: "border-[var(--color-primary)] text-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]",
        }
      : user.isPremium
        ? {
            label: "Premium",
            Icon: Crown,
            cls: "border-amber-400/50 text-amber-300 bg-amber-400/10",
          }
        : {
            label: "Gratis",
            Icon: User,
            cls: "border-[var(--color-line)] text-[var(--color-muted)] bg-[var(--color-glass)]",
          };

  const { label, Icon, cls } = tier;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${cls} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {label}
    </span>
  );
}
