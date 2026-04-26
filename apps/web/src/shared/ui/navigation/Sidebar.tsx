import type { SidebarIconKey, SidebarItem, SidebarProps } from './types'

function SidebarIcon({
  iconKey,
  active,
  danger,
}: {
  iconKey: SidebarIconKey
  active?: boolean
  danger?: boolean
}) {
  const colorClass = danger
    ? 'text-rose-400'
    : active
      ? 'text-white'
      : 'text-slate-400 group-hover:text-slate-200'

  const baseProps = {
    className: `h-4 w-4 ${colorClass}`,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
  }

  switch (iconKey) {
    case 'library':
      return (
        <svg {...baseProps}>
          <rect x="4" y="5" width="4" height="14" rx="1" />
          <rect x="10" y="5" width="4" height="14" rx="1" />
          <rect x="16" y="5" width="4" height="14" rx="1" />
        </svg>
      )

    case 'search':
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4" />
        </svg>
      )

    case 'playlists':
      return (
        <svg {...baseProps}>
          <path d="M4 7h10" />
          <path d="M4 12h10" />
          <path d="M4 17h7" />
          <path d="M18 8v8" />
          <path d="M15 11h6" />
        </svg>
      )

    case 'nowPlaying':
      return (
        <svg {...baseProps}>
          <path d="M6 9v6" />
          <path d="M10 6v12" />
          <path d="M14 10v4" />
          <path d="M18 8v8" />
        </svg>
      )

    case 'equalizer':
      return (
        <svg {...baseProps}>
          <path d="M6 5v14" />
          <path d="M12 5v14" />
          <path d="M18 5v14" />
          <circle cx="6" cy="9" r="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="10" r="2" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'segments':
      return (
        <svg {...baseProps}>
          <path d="M5 12h3" />
          <path d="M10 12h4" />
          <path d="M16 12h3" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )

    case 'stats':
      return (
        <svg {...baseProps}>
          <path d="M6 18V9" />
          <path d="M12 18V5" />
          <path d="M18 18v-7" />
        </svg>
      )

    case 'lyrics':
      return (
        <svg {...baseProps}>
          <path d="M5 8h14" />
          <path d="M5 12h10" />
          <path d="M5 16h8" />
        </svg>
      )

      
    case 'settings':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </svg>
      )

    default:
      return null
  }
}

function SidebarItemLink({ item }: { item: SidebarItem }) {
  const activeClasses = item.active
    ? 'border border-white/40 bg-[#2a2440] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
    : 'border border-transparent text-slate-300 hover:bg-white/[0.04]'

  const labelClass = item.danger
    ? item.active
      ? 'text-rose-300'
      : 'text-rose-400'
    : item.active
      ? 'text-white'
      : 'text-slate-300 group-hover:text-white'

  return (
    <a
      href={item.path}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${activeClasses}`}
    >
      <SidebarIcon iconKey={item.iconKey} active={item.active} danger={item.danger} />

      <span className={`flex-1 text-sm font-medium ${labelClass}`}>{item.label}</span>

      {item.badge ? <span className="inline-flex h-2 w-2 rounded-full bg-rose-400" /> : null}
    </a>
  )
}

export default function Sidebar({
  title = 'MusicFlow',
  version = 'v2.4 • STUDIO',
  items,
}: SidebarProps) {
  return (
    <aside className="flex min-h-screen w-[220px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#18162a_0%,#121120_100%)] px-3 py-4 text-white">
      <div className="mb-4 flex items-center gap-3 px-3">
        <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#b794ff,#6d4cff_60%,#4a2ba8)] shadow-[0_0_30px_rgba(140,92,255,0.35)]" />
        <div>
          <p className="text-base font-semibold leading-none">{title}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">{version}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <SidebarItemLink key={item.path} item={item} />
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-violet-500/20 bg-[linear-gradient(180deg,#1f1a35_0%,#171329_100%)] px-4 py-3 text-left transition hover:border-violet-400/30"
        >
          <span className="text-sm font-semibold text-violet-100">AI Mixer</span>
          <span className="text-[11px] text-slate-400">⌘K</span>
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-400 text-xs font-semibold">
            IV
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Ines Varga</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Studio</p>
          </div>

          <button type="button" className="text-slate-500 hover:text-slate-300">
            •••
          </button>
        </div>
      </div>
    </aside>
  )
}
