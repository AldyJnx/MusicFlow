import { NavLink } from "react-router-dom";

import { useAuthStore } from "../../../shared/stores/authStore";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ClientSidebarFooter({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.username ?? "—";
  const planLabel = user?.isPremium ? "Premium" : "Free";
  const initials = initialsOf(displayName);

  return (
    <div className="space-y-3">
      <NavLink
        to="/ai-mixer"
        className={({ isActive }) =>
          `flex w-full rounded-2xl border text-left transition ${
            isActive
              ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
              : "border-[var(--color-border)] bg-[var(--color-page)]/60 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-page)]"
          } ${collapsed ? "justify-center px-2 py-3" : "items-center justify-between px-4 py-3.5"}`
        }
      >
        {({ isActive }) => (
          <>
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              {collapsed ? "AI" : "AI Mixer"}
            </span>
            {!collapsed ? (
              <span
                className={`text-[11px] ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}
              >
                ⌘K
              </span>
            ) : null}
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex rounded-2xl border transition ${
            isActive
              ? "border-[var(--color-primary)] bg-[var(--color-surface-alt)]"
              : "border-[var(--color-border)] bg-[var(--color-page)]/60 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-page)]"
          } ${collapsed ? "justify-center px-2 py-3" : "items-center gap-3 px-4 py-3.5"}`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-400 text-xs font-semibold text-white">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[var(--color-text)]">
                    {displayName}
                  </p>
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      user?.isPremium
                        ? "text-emerald-400"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
                    {planLabel}
                  </p>
                </div>

                <span
                  className={`transition ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <circle cx="6" cy="12" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="18" cy="12" r="1.6" />
                  </svg>
                </span>
              </>
            ) : null}
          </>
        )}
      </NavLink>
    </div>
  );
}
