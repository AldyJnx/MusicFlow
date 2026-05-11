import { CirclePlus, Sparkles } from 'lucide-react'
import { useState } from 'react'

import ClientLayout from '../../layout/ClientLayout'

type SegmentItem = {
  id: number
  label: string
  start: string
  end: string
  accent: 'blue' | 'violet'
  active?: boolean
}

type EqBand = {
  id: number
  label: string
  height: number
  offset: number
}

const segments: SegmentItem[] = [
  { id: 1, label: 'Intro', start: '00:00.00', end: '00:32.40', accent: 'blue' },
  { id: 2, label: 'Verse 1', start: '00:32.40', end: '01:04.22', accent: 'blue', active: true },
  { id: 3, label: 'Chorus', start: '01:04.22', end: '01:36.04', accent: 'violet' },
]

const markers = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30']

const eqBands: EqBand[] = [
  { id: 1, label: 'Low', height: 64, offset: 26 },
  { id: 2, label: 'L-Mid', height: 42, offset: 38 },
  { id: 3, label: 'Mid', height: 78, offset: 18 },
  { id: 4, label: 'H-Mid', height: 56, offset: 24 },
  { id: 5, label: 'High', height: 48, offset: 15 },
]

function PreviewToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`inline-flex h-9 min-w-[96px] items-center gap-2 rounded-lg border px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
        enabled
          ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-text)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
      }`}
    >
      <span>Preview</span>
      <span
        className={`ml-auto inline-flex h-4 w-7 items-center rounded-full transition ${
          enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white transition ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  )
}

function Waveform({
  accent,
  active = false,
}: {
  accent: SegmentItem['accent']
  active?: boolean
}) {
  const waveformStyle =
    accent === 'blue'
      ? {
          borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: active ? 'var(--color-secondary)' : 'var(--color-surface-alt)',
        }
      : {
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.12)',
        }

  const fillClass =
    accent === 'blue' && active
      ? 'bg-[var(--color-primary)] opacity-35'
      : accent === 'blue'
        ? 'bg-[var(--color-border)] opacity-90'
        : 'bg-[#7c3aed] opacity-20'

  return (
    <div className="relative h-40 overflow-hidden rounded-xl border" style={waveformStyle}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
      <div className="absolute inset-y-3 left-3 right-3 flex items-center">
        <div
          className={`h-24 w-full ${fillClass}`}
          style={{
            clipPath:
              'polygon(0% 49%,4% 55%,8% 36%,12% 62%,16% 40%,20% 58%,24% 20%,28% 70%,32% 34%,36% 61%,40% 28%,44% 52%,48% 18%,52% 67%,56% 44%,60% 59%,64% 26%,68% 64%,72% 37%,76% 57%,80% 30%,84% 66%,88% 42%,92% 54%,96% 35%,100% 49%,100% 100%,0% 100%)',
          }}
        />
      </div>
    </div>
  )
}

function EqSlider({ band }: { band: EqBand }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-28 w-6 items-center justify-center">
        <div className="h-full w-1 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute w-1 rounded-full bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary)_100%)]"
          style={{ height: `${band.height}px`, top: `${band.offset}px` }}
        />
        <span
          className="absolute h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_12px_rgba(96,165,250,0.55)]"
          style={{ top: `${band.offset - 2}px` }}
        />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{band.label}</span>
    </div>
  )
}

export default function Segments() {
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const activeSegment = segments.find((segment) => segment.active) ?? segments[0]

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-[42px]">Editor de Segmentos</h1>
              <p className="mt-2 text-sm font-medium text-[var(--color-muted)] sm:text-base">
                Proyecto: "Midnight City (Remastered)" • 128 BPM
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PreviewToggle enabled={previewEnabled} onToggle={() => setPreviewEnabled((current) => !current)} />
              <button
                type="button"
                className="rounded-xl bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-secondary)_100%)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] shadow-[0_10px_28px_rgba(53,118,255,0.35)] transition hover:brightness-110"
              >
                Exportar Mix
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="relative mb-4 grid grid-cols-6 gap-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {markers.map((marker) => (
                <span key={marker}>{marker}</span>
              ))}
              <span className="pointer-events-none absolute left-[24%] top-[-6px] h-6 w-px bg-[var(--color-primary)]">
                <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--color-primary)]" />
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.7fr_1.45fr_1.7fr_0.85fr]">
              {segments.map((segment) => (
                <article key={segment.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        segment.accent === 'blue' ? 'bg-[#60a5fa]' : 'bg-[#a855f7]'
                      }`}
                    />
                    {segment.label}
                  </div>
                  <Waveform accent={segment.accent} active={segment.active} />
                </article>
              ))}

              <article className="flex flex-col gap-2">
                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">Nuevo</div>
                <button
                  type="button"
                  className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
                >
                  <CirclePlus className="h-6 w-6" strokeWidth={1.7} />
                </button>
              </article>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.8fr]">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">Ecualización por Segmento</h2>
                <span className="self-start rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Preset: Vocal Punch
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-5">
                {eqBands.map((band) => (
                  <EqSlider key={band.id} band={band} />
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
              <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-[var(--color-text)]">Detalles del Segmento</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <span className="text-sm font-semibold text-[var(--color-muted)]">Nombre</span>
                  <span className="text-sm font-semibold text-[var(--color-primary)]">{activeSegment.label}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <span className="text-sm font-semibold text-[var(--color-muted)]">Inicio</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{activeSegment.start}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <span className="text-sm font-semibold text-[var(--color-muted)]">Fin</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{activeSegment.end}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pb-2">
                  <span className="text-sm font-semibold text-[var(--color-muted)]">Duración</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">00:31.82</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-secondary)]"
              >
                <Sparkles className="h-4 w-4" strokeWidth={2.3} />
                Optimizar Segmento
              </button>
            </aside>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
