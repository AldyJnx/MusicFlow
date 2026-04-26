import { useMemo, useState } from 'react'

type LibraryTab = 'Songs' | 'Albums' | 'Artists' | 'Genres'
type GenreFilter = 'All' | 'Indie' | 'Electronic' | 'Jazz' | 'Rock'

type Track = {
  id: number
  title: string
  artist: string
  album: string
  genre: Exclude<GenreFilter, 'All'>
  time: string
  accent: string
  icon: string
  eq: boolean
  favorite?: boolean
}

const stats = [
  { label: 'Tracks', value: '2,486', accent: 'from-fuchsia-500 to-violet-400' },
  { label: 'With custom EQ', value: '16/32', accent: 'from-violet-500 to-indigo-300' },
  { label: 'Segments defined', value: '143', accent: 'from-cyan-400 to-sky-300' },
  { label: 'AI tunes applied', value: '87', accent: 'from-amber-400 to-yellow-300' },
]

const tracks: Track[] = [
  {
    id: 1,
    title: 'Nebula Drift',
    artist: 'Vaan Holloway',
    album: 'Long Orbit',
    genre: 'Indie',
    time: '4:07',
    accent: 'from-violet-500 to-fuchsia-400',
    icon: '✦',
    eq: true,
    favorite: true,
  },
  {
    id: 2,
    title: 'Inner Weather',
    artist: 'Marianne Opal',
    album: 'Quiet Rooms',
    genre: 'Jazz',
    time: '3:13',
    accent: 'from-sky-500 to-cyan-300',
    icon: '◉',
    eq: false,
  },
  {
    id: 3,
    title: 'Lowland Hymn',
    artist: 'The Fieldnotes',
    album: 'Cartography',
    genre: 'Indie',
    time: '5:12',
    accent: 'from-orange-500 to-amber-300',
    icon: '▥',
    eq: true,
  },
  {
    id: 4,
    title: 'Moth to Static',
    artist: 'Hollow Lux',
    album: 'Vapor Years',
    genre: 'Electronic',
    time: '3:41',
    accent: 'from-indigo-500 to-blue-300',
    icon: '⬤',
    eq: true,
  },
  {
    id: 5,
    title: 'Slow Burn Paper',
    artist: 'Ines Varga',
    album: 'On Leaving',
    genre: 'Jazz',
    time: '4:28',
    accent: 'from-lime-400 to-emerald-300',
    icon: '◩',
    eq: false,
  },
  {
    id: 6,
    title: 'Neon Vestibule',
    artist: 'CHROMEPARK',
    album: 'B-Side Ghosts',
    genre: 'Electronic',
    time: '3:04',
    accent: 'from-pink-500 to-rose-300',
    icon: '✣',
    eq: true,
  },
  {
    id: 7,
    title: 'Ashes in Reverse',
    artist: 'North Arcade',
    album: 'Static Bloom',
    genre: 'Rock',
    time: '4:52',
    accent: 'from-red-500 to-orange-300',
    icon: '⬢',
    eq: false,
  },
]

const tabs: LibraryTab[] = ['Songs', 'Albums', 'Artists', 'Genres']
const genres: GenreFilter[] = ['All', 'Indie', 'Electronic', 'Jazz', 'Rock']

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path d="M12 3v11" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18h14" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M9 7h10" strokeLinecap="round" />
      <path d="M9 12h10" strokeLinecap="round" />
      <path d="M9 17h10" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18" cy="12" r="1.7" />
    </svg>
  )
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('Songs')
  const [activeGenre, setActiveGenre] = useState<GenreFilter>('All')
  const [compactMode, setCompactMode] = useState(true)

  const filteredTracks = useMemo(() => {
    if (activeGenre === 'All') {
      return tracks
    }

    return tracks.filter((track) => track.genre === activeGenre)
  }, [activeGenre])

  return (
    <main className="min-h-screen bg-[#090914] text-slate-100">
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(126,77,255,0.12),transparent_32%),linear-gradient(180deg,#0b0b14_0%,#080810_100%)] px-6 py-6 xl:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-fuchsia-200/70">
                Library · 2,486 Tracks
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-[48px]">
                Your collection
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Everything you&apos;ve saved, tuned, and scoped. Segments and custom EQs follow each track.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-[#141422] px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-[#1a1a2b]"
            >
              <ImportIcon />
              Import
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <article
                key={item.label}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#121221] px-5 py-5"
              >
                <div className={`absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b ${item.accent}`} />
                <p className="pl-3 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500">
                  {item.label}
                </p>
                <p className="pl-3 pt-3 text-4xl font-semibold tracking-tight text-white">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 text-sm font-medium transition ${
                    activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                  {activeTab === tab ? (
                    <span className="absolute inset-x-0 -bottom-4 h-0.5 rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-400" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setActiveGenre(genre)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                      activeGenre === genre
                        ? 'border-violet-400/60 bg-violet-500/20 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.35)]'
                        : 'border-white/10 bg-[#141422] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompactMode(true)}
                  className={`rounded-xl border p-2 transition ${
                    compactMode
                      ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-200'
                      : 'border-white/10 bg-[#141422] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setCompactMode(false)}
                  className={`rounded-xl border p-2 transition ${
                    compactMode
                      ? 'border-white/10 bg-[#141422] text-slate-400 hover:text-slate-200'
                      : 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-200'
                  }`}
                >
                  <GridIcon />
                </button>
              </div>
            </div>
          </div>

          {compactMode ? (
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d19]">
              <div className="hidden grid-cols-[56px_minmax(220px,2fr)_minmax(180px,1.3fr)_140px_90px_56px] items-center gap-4 px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-500 md:grid">
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Genre</span>
                <span>Time</span>
                <span />
              </div>

              <div className="divide-y divide-white/5">
                {filteredTracks.map((track, index) => (
                  <article
                    key={track.id}
                    className={`grid gap-4 px-4 py-4 transition md:grid-cols-[56px_minmax(220px,2fr)_minmax(180px,1.3fr)_140px_90px_56px] md:items-center ${
                      index === 0
                        ? 'bg-gradient-to-r from-violet-500/12 via-fuchsia-500/10 to-transparent'
                        : 'hover:bg-[#141422]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className={`text-xs font-semibold ${track.favorite ? 'text-rose-300' : 'text-slate-600'}`}>
                        {track.favorite ? '✦' : `${String(index + 1).padStart(2, '0')}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${track.accent} text-lg font-semibold text-white shadow-lg shadow-black/20`}
                      >
                        {track.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-white sm:text-base">{track.title}</h2>
                          {track.eq ? (
                            <span className="rounded-md border border-violet-300/20 bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                              EQ
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-400">{track.artist}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 md:text-[15px]">{track.album}</p>
                    <p className="text-sm text-slate-400">{track.genre}</p>
                    <p className="text-sm text-slate-400">{track.time}</p>

                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                    >
                      <MoreIcon />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTracks.map((track) => (
                <article
                  key={track.id}
                  className="rounded-[28px] border border-white/10 bg-[#121221] p-5 transition hover:-translate-y-1 hover:border-white/20"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${track.accent} text-2xl text-white shadow-lg shadow-black/30`}
                  >
                    {track.icon}
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{track.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">{track.artist}</p>
                    </div>
                    {track.eq ? (
                      <span className="rounded-md border border-violet-300/20 bg-violet-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                        EQ
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 space-y-2 text-sm text-slate-400">
                    <p>Album: {track.album}</p>
                    <p>Genre: {track.genre}</p>
                    <p>Time: {track.time}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
