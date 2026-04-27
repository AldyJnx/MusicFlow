import ClientLayout from '../layout/ClientLayout'

type Playlist = {
  id: number
  title: string
  tracks: number
  description: string
  eq?: boolean
}

const playlists: Playlist[] = [
  {
    id: 1,
    title: 'Late Commute',
    tracks: 24,
    description: 'Headphone-led evenings.',
    eq: true,
  },
  {
    id: 2,
    title: 'Paper Lanterns',
    tracks: 42,
    description: 'Warm indie + folk.',
  },
  {
    id: 3,
    title: 'Studio B — Mixing',
    tracks: 18,
    description: 'Reference set for long sessions.',
    eq: true,
  },
  {
    id: 4,
    title: 'Thistle Garden',
    tracks: 31,
    description: 'Brittle, bright, acoustic.',
    eq: true,
  },
  {
    id: 5,
    title: 'Ghost Rotations',
    tracks: 56,
    description: 'Electronic B-sides.',
  },
  {
    id: 6,
    title: 'Blue Hour',
    tracks: 27,
    description: 'Sunset drives.',
    eq: true,
  },
  {
    id: 7,
    title: 'Room for One',
    tracks: 19,
    description: 'Solo evenings.',
  },
  {
    id: 8,
    title: 'Long Orbit',
    tracks: 35,
    description: 'Deep, slow, cinematic.',
    eq: true,
  },
]

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 5v14" strokeLinecap="round" />
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

export default function PlaylistsPage() {
  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(126,77,255,0.11),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#090a13_0%,#090913_100%)] px-7 py-7 text-slate-100 xl:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-rose-300/70">
                Playlists
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-[52px]">
                Your sound signatures
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Every playlist can carry its own EQ. Open one to view its scoped curve.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-[linear-gradient(180deg,#8f5cff_0%,#6f3ff3_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(111,63,243,0.35)] transition hover:brightness-110"
            >
              <PlusIcon />
              New playlist
            </button>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <article key={playlist.id} className="group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-semibold leading-none tracking-tight text-white transition group-hover:text-fuchsia-100">
                      {playlist.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-500">
                      {playlist.tracks} tracks <span className="px-1.5">·</span>
                      {playlist.description}
                    </p>
                  </div>

                  {playlist.eq ? (
                    <span className="rounded-md border border-violet-300/20 bg-violet-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200">
                      EQ
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
