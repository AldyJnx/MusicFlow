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
import AnimatedBackground from "../components/AnimatedBackground";
import RightPanel from "../components/RightPanel";
import AIAssistantFab from "../components/AIAssistantFab";
import ImportModal from "../features/import/ImportModal";
import CommandPalette from "../features/command-palette/CommandPalette";
import { usePlayerStore } from "../stores/playStore";
import { useSegmentEngineSync } from "../../shared/hooks/useTrackSegments";
import { useAutoApplyEQ } from "../../shared/hooks/useAutoApplyEQ";
import { useRecordPlays } from "../../shared/hooks/useAnalytics";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const sidebarWidth = collapsed ? 72 : 196;
  const navbarRef = useRef<NavbarRef>(null);

  // Keep the audio engine's segment scheduler in sync with the current track.
  // Mounted exactly once here so MiniPlayer/ExpandedPlayer mounts/unmounts
  // don't race over engine.segments.setSegments(...).
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  useSegmentEngineSync(currentTrackId);
  // Resolves and applies the EQ cascade (Segment → Track → Playlist → Global)
  // whenever the current track or its playlist context changes.
  useAutoApplyEQ();
  // Records a play event each time the current track changes (best-effort).
  useRecordPlays();

  return (
    <div className="relative flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <AnimatedBackground />
      <ClientSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onFocusSearch={() => navbarRef.current?.focusSearch()}
        onOpenImport={() => setImportOpen(true)}
      />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <Navbar ref={navbarRef} />
        <main className="flex-1">{children}</main>
        <ExpandedPlayer sidebarOffset={sidebarWidth} />
        <MiniPlayer sidebarOffset={sidebarWidth} />
      </div>

      <RightPanel
        collapsed={rightCollapsed}
        onToggle={() => setRightCollapsed((c) => !c)}
      />

      {/* Overlays driven from the persistent player. Mounted once at the
            layout so they share state across MiniPlayer / ExpandedPlayer and
            survive route changes. */}
      <EqDrawer />
      <AIQuickPrompt />
      <AIAssistantFab />
      <QueueDrawer />
      <UpgradeModal />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <CommandPalette onOpenImport={() => setImportOpen(true)} />
    </div>
  );
}
