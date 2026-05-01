import type { ReactNode } from 'react'
import { useState } from 'react'
import ExpandedPlayer from '../features/player/ExpandedPlayer'
import MiniPlayer from '../features/player/MiniPlayer'
import Navbar from '../../shared/ui/navigation/Navbar'
import Sidebar from '../../shared/ui/navigation/Sidebar'
import { sidebarClient } from '../components/navigation/sidebarClient'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 96 : 236

  return (
    <div className="flex min-h-screen bg-[#090914]">
      <Sidebar
        items={sidebarClient}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <ExpandedPlayer sidebarOffset={sidebarWidth} />
        <MiniPlayer sidebarOffset={sidebarWidth} />
      </div>
    </div>
  )
}
