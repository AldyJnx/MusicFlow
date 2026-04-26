import type { ReactNode } from 'react'
import { useState } from 'react'
import Sidebar from '../../shared/ui/navigation/Sidebar'
import { sidebarClient } from '../components/navigation/sidebarClient'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#090914]">
      <Sidebar
        items={sidebarClient}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
