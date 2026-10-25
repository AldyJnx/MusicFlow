import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import CreateLibraryModal, {
  EditLibraryModal,
} from "../features/playlists/CreateLibraryModal";
import type { Playlist } from "../../shared/api/playlists";
import CommandPalette from "../features/command-palette/CommandPalette";
import { usePlayerStore } from "../stores/playStore";
import { useSegmentEngineSync } from "../../shared/hooks/useTrackSegments";
import { useAutoApplyEQ } from "../../shared/hooks/useAutoApplyEQ";
import { useRecordPlays } from "../../shared/hooks/useAnalytics";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { getElectronAPI } from "../../platform/electronAPI";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [createLibraryOpen, setCreateLibraryOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Playlist | null>(null);
  const [deleteLibraryOpen, setDeleteLibraryOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  const navbarRef = useRef<NavbarRef>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarPosition, queuePosition, lyricsScale } = usePreferences();
  const isExpanded = usePlayerStore((state) => state.isExpanded);
  const setExpanded = usePlayerStore((state) => state.setExpanded);
  const previousPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const didNavigate = previousPathnameRef.current !== location.pathname;
    previousPathnameRef.current = location.pathname;
    if (didNavigate && location.pathname !== "/now-playing" && isExpanded) {
      setExpanded(false);
    }
  }, [isExpanded, location.pathname, setExpanded]);

  const sidebarWidth = isDesktop ? (collapsed ? 72 : 196) : 0;
  const rightPanelWidth = isDesktop ? (rightCollapsed ? 64 : 322) : 0;
  const sidebarOnLeft = sidebarPosition === "left";
  const queueOnLeft = queuePosition === "left";
  const sidebarOffset =
    sidebarOnLeft && queueOnLeft
      ? 0
      : !sidebarOnLeft && !queueOnLeft
        ? rightPanelWidth
        : 0;
  const queueOffset =
    queueOnLeft && sidebarOnLeft
      ? sidebarWidth
      : !queueOnLeft && !sidebarOnLeft
        ? 0
        : 0;
  const contentLeft =
    (sidebarOnLeft ? sidebarWidth : 0) + (queueOnLeft ? rightPanelWidth : 0);
  const contentRight =
    (sidebarOnLeft ? 0 : sidebarWidth) + (queueOnLeft ? 0 : rightPanelWidth);

  useEffect(() => {
    let accumulated = 0;
    let resetTimer: number | undefined;
    let cooldownUntil = 0;
    const navigateTrack = (direction: "next" | "previous") => {
      const now = Date.now();
      if (now < cooldownUntil) return;
      cooldownUntil = now + 650;
      accumulated = 0;
      const player = usePlayerStore.getState();
      void (direction === "next" ? player.next() : player.previous());
    };
    const handleWheel = (event: WheelEvent) => {
      if (
        Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.35 ||
        Math.abs(event.deltaX) < 2
      )
        return;
      accumulated += event.deltaX;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        accumulated = 0;
      }, 420);
      if (Math.abs(accumulated) < 30) return;
      navigateTrack(accumulated < 0 ? "next" : "previous");
    };
    const handleGestureEnd = (event: Event) => {
      const gesture = event as Event & { direction?: string };
      if (gesture.direction === "left") navigateTrack("next");
      if (gesture.direction === "right") navigateTrack("previous");
    };
    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: true,
    });
    window.addEventListener(
      "gestureend",
      handleGestureEnd as EventListener,
      true,
    );
    const unsubscribe = getElectronAPI()?.onSwipe?.((direction) =>
      navigateTrack(direction === "left" ? "next" : "previous"),
    );
    return () => {
      window.removeEventListener("wheel", handleWheel, true);
      window.removeEventListener(
        "gestureend",
        handleGestureEnd as EventListener,
        true,
      );
      window.clearTimeout(resetTimer);
      unsubscribe?.();
    };
  }, []);

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
        onOpenCreateLibrary={() => setCreateLibraryOpen(true)}
        onEditLibrary={(playlist) => {
          setDeleteLibraryOpen(false);
          setEditingLibrary(playlist);
        }}
        onDeleteLibrary={(playlist) => {
          setDeleteLibraryOpen(true);
          setEditingLibrary(playlist);
        }}
        onNavigate={() => setExpanded(false)}
        position={sidebarPosition}
        offset={sidebarOffset}
      />
      <div
        className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{
          marginLeft: contentLeft,
          marginRight: contentRight,
          ["--lyrics-scale" as string]: lyricsScale,
        }}
      >
        <Navbar ref={navbarRef} />
        <main className="flex-1">{children}</main>
        <ExpandedPlayer
          sidebarOffset={contentLeft}
          rightPanelOffset={contentRight}
        />
        <MiniPlayer sidebarOffset={contentLeft} />
      </div>

      <RightPanel
        collapsed={rightCollapsed}
        onToggle={() => setRightCollapsed((c) => !c)}
        position={queuePosition}
        offset={queueOffset}
      />

      {/* Overlays driven from the persistent player. Mounted once at the
            layout so they share state across MiniPlayer / ExpandedPlayer and
            survive route changes. */}
      <EqDrawer />
      <AIQuickPrompt />
      <AIAssistantFab />
      <QueueDrawer />
      <UpgradeModal />
      <CreateLibraryModal
        open={createLibraryOpen}
        onClose={() => setCreateLibraryOpen(false)}
      />
      <EditLibraryModal
        playlist={editingLibrary}
        startDelete={deleteLibraryOpen}
        onClose={() => {
          setEditingLibrary(null);
          setDeleteLibraryOpen(false);
        }}
        onDeleted={(playlistId) => {
          if (location.pathname === `/playlists/${playlistId}`) {
            navigate("/inicio", { replace: true });
          }
        }}
      />
      <CommandPalette />
    </div>
  );
}
