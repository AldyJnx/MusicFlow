import { Bell, Search } from 'lucide-react'

type NavbarProps = {
  placeholder?: string
}

export default function Navbar({
  placeholder = 'Buscar música, artistas...',
}: NavbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 bg-[#15161d] px-6 py-3">
      <div className="w-10 shrink-0" />

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-md items-center gap-3 rounded-full bg-[#1d1f26] px-4 py-2.5">
          <Search className="h-4 w-4 text-slate-500" strokeWidth={2.2} />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" strokeWidth={2.1} />
      </button>
    </header>
  )
}
