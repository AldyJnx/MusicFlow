import type { ReactNode } from "react";
import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../shared/ui/navigation/Sidebar";
import { sidebarAdmin } from "../components/navigation/sidebarAdmin";
import { useAuthStore } from "../../shared/stores/authStore";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  function handleLogout() {
    clear();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <Sidebar
        items={sidebarAdmin}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-navbar)] px-6 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
                {user.username} · {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:border-rose-400/40 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
