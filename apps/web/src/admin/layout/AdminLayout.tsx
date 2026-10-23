import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Sidebar from "../../shared/ui/navigation/Sidebar";
import { sidebarAdmin } from "../components/navigation/sidebarAdmin";
import AdminAccountMenu from "../components/navigation/AdminAccountMenu";
import AdminNvidiaAssistant from "../components/AdminNvidiaAssistant";
import { usePlayerStore } from "../../client/stores/playStore";

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const state = usePlayerStore.getState();
    if (state.isPlaying) state.pause();
    if (state.eqDrawerOpen) state.closeEqDrawer();
    if (state.aiPromptOpen) state.closeAiPrompt();
    if (state.isExpanded) state.setExpanded(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <Sidebar
        items={sidebarAdmin}
        version={t("admin.layout.panel")}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        footer={<AdminAccountMenu collapsed={collapsed} />}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center border-b border-[var(--color-border)] bg-[var(--color-navbar)] px-6 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {t("admin.layout.panel")}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children ?? <Outlet />}</main>
        <AdminNvidiaAssistant />
      </div>
    </div>
  );
}
