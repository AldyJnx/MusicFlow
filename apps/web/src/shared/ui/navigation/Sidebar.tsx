import { NavLink } from 'react-router-dom'
import musicFlowLogo from '../../assets/MusicFlowLogo.png'
import type { SidebarIconKey, SidebarProps } from './types'

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
      ? 'text-[#3b82f6]'
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

export default function Sidebar({
  title = 'MusicFlow',
  version = 'Client navigation',
  items,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col overflow-x-visible overflow-y-auto border-r border-slate-800 bg-[#0b0d12] py-4 text-white transition-all duration-300 ${
        collapsed ? 'w-[96px] px-2' : 'w-[236px] px-0'
      }`}
    >
      <div className={`relative mb-5 flex items-center ${collapsed ? 'justify-center px-1' : 'gap-3 px-4'}`}>
        <img src={musicFlowLogo} alt="MusicFlow" className="h-9 w-9 shrink-0 rounded-lg object-cover" />

        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-200">{title}</p>
            <p className="mt-1 text-[10px] text-slate-500">{version}</p>
          </div>
        ) : null}

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-[#0f1117] text-slate-400 transition hover:border-slate-500 hover:text-white ${
              collapsed ? 'absolute -right-5 top-1/2 z-20 -translate-y-1/2' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="mt-4 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/library'}
            className={({ isActive }) =>
              `group relative flex items-center transition ${
                isActive
                  ? 'bg-[#10182d] text-[#3b82f6]'
                  : 'text-slate-400 hover:bg-[#0f1218] hover:text-slate-200'
              } ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-4'}`
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <SidebarIcon iconKey={item.iconKey} active={isActive} danger={item.danger} />

                {!collapsed ? (
                  <>
                    <span
                      className={`flex-1 text-[15px] font-medium ${
                        item.danger
                          ? isActive
                            ? 'text-rose-300'
                            : 'text-rose-400'
                          : isActive
                            ? 'text-[#3b82f6]'
                            : 'text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      {item.label}
                    </span>

                    {item.badge ? <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" /> : null}
                  </>
                ) : item.badge ? (
                  <span className="absolute right-3 top-3 inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-6">
        <div className="space-y-3">
          <NavLink
            to="/ai-mixer"
            className={({ isActive }) =>
              `flex w-full rounded-2xl border text-left transition ${
                isActive
                  ? 'border-[#315cc7] bg-[#152446]'
                  : 'border-slate-800 bg-[#101218] hover:border-slate-700 hover:bg-[#131722]'
              } ${collapsed ? 'justify-center px-2 py-3' : 'items-center justify-between px-4 py-3.5'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-[15px] font-semibold ${isActive ? 'text-white' : 'text-slate-100'}`}>
                  {collapsed ? 'AI' : 'AI Mixer'}
                </span>
                {!collapsed ? (
                  <span className={`text-[11px] ${isActive ? 'text-[#7ba0ff]' : 'text-slate-500'}`}>⌘K</span>
                ) : null}
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex rounded-2xl border transition ${
                isActive
                  ? 'border-[#315cc7] bg-[#152446]'
                  : 'border-slate-800 bg-[#101218] hover:border-slate-700 hover:bg-[#131722]'
              } ${collapsed ? 'justify-center px-2 py-3' : 'items-center gap-3 px-4 py-3.5'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-400 text-xs font-semibold text-white">
                  IV
                </div>

                {!collapsed ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[15px] font-semibold ${isActive ? 'text-white' : 'text-white'}`}>
                        Ines Varga
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                        Studio
                      </p>
                    </div>

                    <span className={`transition ${isActive ? 'text-[#7ba0ff]' : 'text-slate-500 hover:text-slate-300'}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <circle cx="6" cy="12" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="18" cy="12" r="1.6" />
                      </svg>
                    </span>
                  </>
                ) : null}
              </>
            )}
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
