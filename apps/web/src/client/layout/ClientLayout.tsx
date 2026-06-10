import type { ReactNode } from "react";
import { useRef, useState } from "react";
import ExpandedPlayer from "../features/player/ExpandedPlayer";
import MiniPlayer from "../features/player/MiniPlayer";
import EqDrawer from "../features/player/EqDrawer";
import AIQuickPrompt from "../features/player/AIQuickPrompt";
import QueueDrawer from "../features/player/QueueDrawer";
import UpgradeModal from "../features/billing/UpgradeModal";
import Navbar, { type NavbarRef } from "../../shared/ui/navigation/Navbar";
import ClientSidebar from "../components/navigation/ClientSidebar";
import ImportModal from "../features/import/ImportModal";
import { usePlayerStore } from "../stores/playStore";
import { useSegmentEngineSync } from "../../shared/hooks/useTrackSegments";
import { useAutoApplyEQ } from "../../shared/hooks/useAutoApplyEQ";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const sidebarWidth = collapsed ? 88 : 300;
  const navbarRef = useRef<NavbarRef>(null);

  // Keep the audio engine's segment scheduler in sync with the current track.
  // Mounted exactly once here so MiniPlayer/ExpandedPlayer mounts/unmounts
  // don't race over engine.segments.setSegments(...).
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  useSegmentEngineSync(currentTrackId);
  // Resolves and applies the EQ cascade (Segment → Track → Playlist → Global)
  // whenever the current track or its playlist context changes.
  useAutoApplyEQ();

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <ClientSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onFocusSearch={() => navbarRef.current?.focusSearch()}
        onOpenImport={() => setImportOpen(true)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar ref={navbarRef} />
        <main className="flex-1">{children}</main>
        <ExpandedPlayer sidebarOffset={sidebarWidth} />
        <MiniPlayer sidebarOffset={sidebarWidth} />
      </div>

      {/* Overlays driven from the persistent player. Mounted once at the
            layout so they share state across MiniPlayer / ExpandedPlayer and
            survive route changes. */}
      <EqDrawer />
      <AIQuickPrompt />
      <QueueDrawer />
      <UpgradeModal />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
