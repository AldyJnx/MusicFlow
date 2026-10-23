import { LogOut, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../../shared/stores/authStore";
import { usePlayerStore } from "../../../client/stores/playStore";

export default function AdminAccountMenu({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();
  const initials = (user?.username || user?.email || "A")
    .slice(0, 1)
    .toUpperCase();

  function logout() {
    usePlayerStore.getState().stop();
    clear();
    navigate("/", { replace: true });
  }

  return (
    <div
      className="group relative"
      onBlur={(event) =>
        !event.currentTarget.contains(event.relatedTarget) && undefined
      }
    >
      <button
        type="button"
        className={`flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2 text-left transition hover:border-[var(--color-primary)] ${collapsed ? "justify-center" : ""}`}
        aria-haspopup="menu"
        aria-label="Cuenta de administrador"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-primary-contrast)]">
            {initials}
          </span>
        )}
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-[var(--color-text)]">
              {user?.username ?? "Administrador"}
            </span>
            <span className="block truncate text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Administrador
            </span>
          </span>
        ) : null}
      </button>
      <div
        role="menu"
        className={`invisible absolute bottom-full z-50 mb-2 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${collapsed ? "left-full ml-2" : "left-0"}`}
      >
        <Link
          to="/admin/settings"
          role="menuitem"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
        >
          <Settings2 className="h-4 w-4 text-[var(--color-primary)]" />
          Configuración
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
