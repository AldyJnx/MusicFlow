import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../../shared/ui/navigation/Sidebar";
import { sidebarArtist } from "../components/navigation/sidebarArtist";

export default function ArtistLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
      <Sidebar
        title="MusicFlow Studio"
        version="Espacio de artista"
        items={sidebarArtist}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
