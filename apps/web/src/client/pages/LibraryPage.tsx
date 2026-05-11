import { Clock3, Equal, Music4, MoreHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { librarySongs, type LibraryGenre, type LibrarySong } from '../features/library/librarySongs'
import ClientLayout from '../layout/ClientLayout'
import { playerStore } from '../stores/playStore'

type LibraryTab = 'Canciones' | 'Álbumes' | 'Artistas'
const tabs: LibraryTab[] = ['Canciones', 'Álbumes', 'Artistas']
const genres: LibraryGenre[] = ['Indie', 'Electronic', 'Jazz', 'Rock']

const statCards = [
  {
    label: 'Total canciones',
    value: '1,284',
    icon: Music4,
  },
  {
    label: 'EQ aplicados',
    value: '412',
    icon: Equal,
  },
  {
    label: 'Segmentos definidos',
    value: '56',
    icon: Sparkles,
  },
]

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('Canciones')
  const [activeGenre, setActiveGenre] = useState<LibraryGenre | null>(null)

  const filteredSongs = useMemo<LibrarySong[]>(() => {
    if (!activeGenre) {
      return librarySongs
    }

    return librarySongs.filter((song) => song.genre === activeGenre)
  }, [activeGenre])

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-6 py-6 text-[var(--color-text)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon

              return (
                <article
                  key={card.label}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-5"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{card.value}</p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">Tu Biblioteca</h1>
                <div className="mt-3 flex items-center gap-5 border-b border-[var(--color-border)] pb-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative pb-2 text-sm font-medium transition ${
                        activeTab === tab ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {tab}
                      {activeTab === tab ? (
                        <span className="absolute inset-x-0 -bottom-[9px] h-0.5 rounded-full bg-[var(--color-primary)]" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Géneros:
                </span>
                {genres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setActiveGenre((current) => (current === genre ? null : genre))}
                    className={`rounded-full border px-4 py-1.5 text-sm transition ${
                      activeGenre === genre
                        ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <div className="grid grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px] items-center gap-4 border-b border-[var(--color-border)] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                <span>#</span>
                <span>Título</span>
                <span>Álbum</span>
                <span>Estado EQ</span>
                <span className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
                </span>
                <span />
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {filteredSongs.map((song, index) => (
                  <article
                    key={song.id}
                    className="grid cursor-pointer grid-cols-[58px_minmax(260px,1.8fr)_minmax(170px,1.1fr)_160px_90px_48px] items-center gap-4 px-4 py-4 transition hover:bg-[var(--color-surface)]"
                    onClick={() =>
                      playerStore.setTrack({
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        cover: song.cover,
                        duration: song.duration,
                      })
                    }
                  >
                    <span className="text-xs font-semibold text-[var(--color-muted)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="flex items-center gap-4">
                      <img src={song.cover} alt={song.title} className="h-14 w-14 rounded-md object-cover" />
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{song.title}</h2>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{song.artist}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-lg italic text-[var(--color-muted)]">{song.album}</p>
                    </div>

                    <div>
                      {song.eqLabel ? (
                        <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-primary)] bg-[var(--color-secondary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                          <Equal className="h-3.5 w-3.5" strokeWidth={2.3} />
                          {song.eqLabel}
                        </span>
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </div>

                    <span className="text-sm text-[var(--color-muted)]">{song.duration}</span>

                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                    >
                      <MoreHorizontal className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
