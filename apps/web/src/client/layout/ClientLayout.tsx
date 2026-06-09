import type { ReactNode } from "react";
import { useState } from "react";
import ExpandedPlayer from "../features/player/ExpandedPlayer";
import MiniPlayer from "../features/player/MiniPlayer";
import EqDrawer from "../features/player/EqDrawer";
import AIQuickPrompt from "../features/player/AIQuickPrompt";
import Navbar from "../../shared/ui/navigation/Navbar";
import Sidebar from "../../shared/ui/navigation/Sidebar";
import { sidebarClient } from "../components/navigation/sidebarClient";
import ClientSidebarFooter from "../components/navigation/ClientSidebarFooter";
import { usePlayerStore } from "../stores/playStore";
import { useSegmentEngineSync } from "../../shared/hooks/useTrackSegments";
import { useAutoApplyEQ } from "../../shared/hooks/useAutoApplyEQ";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 96 : 236;

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
      <Sidebar
        items={sidebarClient}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        footer={<ClientSidebarFooter collapsed={collapsed} />}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <ExpandedPlayer sidebarOffset={sidebarWidth} />
        <MiniPlayer sidebarOffset={sidebarWidth} />
      </div>

      {/* Overlays driven from the persistent player. Mounted once at the
          layout so they share state across MiniPlayer / ExpandedPlayer and
          survive route changes. */}
      <EqDrawer />
      <AIQuickPrompt />
    </div>
  );
}
