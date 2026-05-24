import { CirclePlus, Plus } from 'lucide-react'
import ClientLayout from '../layout/ClientLayout'

type Playlist = {
  id: number
  title: string
  curator: string
  cover: string
  isActive?: boolean
}

const playlists: Playlist[] = [
  {
    id: 1,
    title: 'Cyberpunk Resonance',
    curator: 'Creado por Alex Flow',
    cover: 'https://i.scdn.co/image/ab67616d0000b27332a7d87248d1b75463483df5',
    isActive: true,
  },
  {
    id: 2,
    title: 'Minimal Tech Focus',
    curator: 'MusicFlow Curated',
    cover: 'https://upload.wikimedia.org/wikipedia/en/3/35/The_Eminem_Show.jpg',
  },
  {
    id: 3,
    title: 'Midnight Jazz AI',
    curator: 'Algorithmic Soul',
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4P7DOE_-A4ad1a-KV3vmJdVPMGh4husVMuQ&s',
    isActive: true,
  },
  {
    id: 4,
    title: 'Urban Night Drive',
    curator: 'Sara Mendez',
    cover: 'https://http2.mlstatic.com/D_NQ_NP_986580-MLA99990684673_112025-O.webp',
  },
]

export default function PlaylistsPage() {
  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[var(--color-text)] sm:text-[38px]">
                Mis playlists
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-[var(--color-muted)] sm:text-base">
                Organiza tu universo sonoro. Gestiona tus colecciones personalizadas con ingenieria de audio AI.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Crear playlist
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <article
                key={playlist.id}
                className={`group rounded-3xl border bg-[var(--color-surface)] p-3 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] ${
                  playlist.isActive
                    ? 'border-dashed border-[var(--color-primary)] shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={playlist.cover}
                    alt={playlist.title}
                    className="aspect-square w-full rounded-2xl object-cover transition duration-300 group-hover:scale-[1.03]"
                  />

                  {playlist.isActive ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_6px_16px_rgba(59,130,246,0.4)]">
                      <CirclePlus className="h-3 w-3" strokeWidth={2.2} />
                      EQ Active
                    </span>
                  ) : null}
                </div>

                <div className="px-1 pb-1 pt-4">
                  <h2 className="max-w-[11ch] text-lg font-semibold tracking-tight text-[var(--color-text)]">
                    {playlist.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{playlist.curator}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
