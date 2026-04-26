import type { ReactNode } from 'react'
import Sidebar from '../../shared/ui/navigation/Sidebar'
import { sidebarClient } from '../components/navigation/sidebarClient'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#090914]">
      <Sidebar items={sidebarClient} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
