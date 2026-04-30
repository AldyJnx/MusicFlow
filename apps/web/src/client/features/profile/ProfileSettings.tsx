import {
  AudioLines,
  ChevronDown,
  Clock3,
  MapPin,
  Music2,
  NotebookTabs,
  Settings2,
  SquareChartGantt,
} from 'lucide-react'

import ClientLayout from '../../layout/ClientLayout'

type StatCard = {
  id: number
  label: string
  value: string
  icon: typeof Clock3
  accent: string
}

type RecentTrack = {
  id: number
  title: string
  artist: string
  timing: string
  cover: string
}

const avatarUrl = 'https://i.pinimg.com/1200x/0d/c7/fc/0dc7fc4c4bda090b7f39f2d636f9eb0f.jpg'

const stats: StatCard[] = [
  {
    id: 1,
    label: 'Tiempo de escucha',
    value: '1,248h',
    icon: Clock3,
    accent: 'text-sky-400',
  },
  {
    id: 2,
    label: 'Canciones reproducidas',
    value: '24,502',
    icon: Music2,
    accent: 'text-blue-400',
  },
  {
    id: 3,
    label: 'Playlists creadas',
    value: '128',
    icon: NotebookTabs,
    accent: 'text-violet-400',
  },
  {
    id: 4,
    label: 'Canciones con EQ',
    value: '3,120',
    icon: AudioLines,
    accent: 'text-emerald-400',
  },
]

const genres = ['Electronic', 'Synthwave', 'Jazz-Hop', 'Ambient', 'Techno']

const recentTracks: RecentTrack[] = [
  {
    id: 1,
    title: 'Midnight City',
    artist: 'M83 • Hurryin Up',
    timing: 'Escuchado ahora',
    cover:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    title: 'Blue Monday',
    artist: 'New Order • Sub...',
    timing: 'Hace 2 horas',
    cover:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    title: 'Resonance',
    artist: 'Home • Odyssey',
    timing: 'Hace 6 horas',
    cover:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=300&q=80',
  },
]

export default function ProfileSettings() {
  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(91,64,255,0.12),transparent_22%),linear-gradient(180deg,#14151d_0%,#111218_100%)] px-6 py-8 text-slate-100 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="rounded-[28px] border border-white/6 bg-[#171922] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(104,80,255,0.45),transparent_65%)] blur-xl" />
                  <img
                    src={avatarUrl}
                    alt="Alex Rivera"
                    className="relative h-40 w-40 rounded-full border border-[#23263b] object-cover shadow-[0_0_0_6px_rgba(26,29,42,0.9),0_0_30px_rgba(99,102,241,0.24)]"
                  />
                  <button
                    type="button"
                    className="absolute bottom-3 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition hover:brightness-110"
                  >
                    <Settings2 className="h-4 w-4" strokeWidth={2.1} />
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-[#27467f] bg-[#17253f] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#68a0ff]">
                    Premium Member
                  </span>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[40px]">Alex Rivera</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-500" strokeWidth={2} />
                        Madrid, ES
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <SquareChartGantt className="h-4 w-4 text-slate-500" strokeWidth={2} />
                        Unido en 2021
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  Editar Perfil
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-[linear-gradient(180deg,#4c74ff_0%,#3b82f6_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110"
                >
                  Seguir
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <article
                    key={stat.id}
                    className="rounded-[22px] border border-[#1f2838] bg-[#151923] px-5 py-5 shadow-[0_0_0_1px_rgba(44,112,255,0.04),0_0_24px_rgba(0,190,255,0.05)]"
                  >
                    <Icon className={`h-5 w-5 ${stat.accent}`} strokeWidth={2.2} />
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
            <article className="rounded-[28px] border border-white/6 bg-[#171c26] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-white">
                <SquareChartGantt className="h-5 w-5 text-[#68a0ff]" strokeWidth={2.1} />
                Géneros favoritos
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
              >
                Últimos 30 días
                <ChevronDown className="h-4 w-4" strokeWidth={2.1} />
              </button>
            </div>

            <div className="mt-12 grid min-h-[280px] place-items-end">
              <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {genres.map((genre, index) => (
                  <div key={genre} className="text-center">
                    <div
                      className={`mx-auto h-1.5 w-16 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.5)] ${
                        index === 2
                          ? 'bg-[linear-gradient(90deg,#9a6bff_0%,#d06eff_100%)]'
                          : 'bg-[linear-gradient(90deg,#6da8ff_0%,#7fd7ff_100%)]'
                      }`}
                    />
                    <p className="mt-4 text-base font-medium text-slate-400">{genre}</p>
                  </div>
                ))}
              </div>
            </div>
            </article>

            <aside className="rounded-[28px] border border-dashed border-[#2e5da8] bg-[#171c26] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-white">
              <Clock3 className="h-5 w-5 text-[#68a0ff]" strokeWidth={2.1} />
              Actividad reciente
            </h2>

            <div className="mt-6 space-y-5">
              {recentTracks.map((track) => (
                <article key={track.id} className="flex items-start gap-4">
                  <img src={track.cover} alt={track.title} className="h-14 w-14 rounded-xl object-cover" />

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#68a0ff]">{track.timing}</p>
                    <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{track.title}</h3>
                    <p className="mt-1 truncate text-base text-slate-500">{track.artist}</p>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06]"
            >
              Ver todo el historial
            </button>
            </aside>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
