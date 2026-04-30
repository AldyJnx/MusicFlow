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
        enabled ? 'border-white/6 bg-[#232936] text-slate-300' : 'border-white/10 bg-white/[0.04] text-slate-500'
      }`}
    >
      <span>Preview</span>
      <span
        className={`ml-auto inline-flex h-4 w-7 items-center rounded-full transition ${
          enabled ? 'bg-[#2563eb]' : 'bg-white/10'
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
  const accentClasses =
    accent === 'blue'
      ? active
        ? 'border-[#60a5fa] bg-[#203554]'
        : 'border-[#244a87] bg-[#111b31]'
      : 'border-[#7c3aed] bg-[#241834]'

  return (
    <div className={`relative h-40 rounded-xl border ${accentClasses} overflow-hidden`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
      <div className="absolute inset-y-3 left-3 right-3 flex items-center">
        <div
          className={`h-24 w-full opacity-80 ${
            accent === 'blue' && active ? 'bg-[#dbe6f5]' : accent === 'blue' ? 'bg-[#1c2f4f]' : 'bg-[#322247]'
          }`}
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
        <div className="h-full w-1 rounded-full bg-white/8" />
        <div
          className="absolute w-1 rounded-full bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)]"
          style={{ height: `${band.height}px`, top: `${band.offset}px` }}
        />
        <span
          className="absolute h-2.5 w-2.5 rounded-full bg-[#60a5fa] shadow-[0_0_12px_rgba(96,165,250,0.55)]"
          style={{ top: `${band.offset - 2}px` }}
        />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{band.label}</span>
    </div>
  )
}

export default function Segments() {
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const activeSegment = segments.find((segment) => segment.active) ?? segments[0]

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[#111218] px-4 py-6 text-slate-100 sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(20,22,31,0.98)_0%,rgba(15,16,24,0.98)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[42px]">Editor de Segmentos</h1>
              <p className="mt-2 text-sm font-medium text-slate-400 sm:text-base">
                Proyecto: "Midnight City (Remastered)" • 128 BPM
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PreviewToggle enabled={previewEnabled} onToggle={() => setPreviewEnabled((current) => !current)} />
              <button
                type="button"
                className="rounded-xl bg-[linear-gradient(180deg,#3576ff_0%,#2d5fe6_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,118,255,0.35)] transition hover:brightness-110"
              >
                Exportar Mix
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-4">
            <div className="relative mb-4 grid grid-cols-6 gap-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              {markers.map((marker) => (
                <span key={marker}>{marker}</span>
              ))}
              <span className="pointer-events-none absolute left-[24%] top-[-6px] h-6 w-px bg-[#3b82f6]">
                <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#3b82f6]" />
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.7fr_1.45fr_1.7fr_0.85fr]">
              {segments.map((segment) => (
                <article key={segment.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
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
                <div className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Nuevo</div>
                <button
                  type="button"
                  className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] text-slate-600 transition hover:border-white/20 hover:text-slate-400"
                >
                  <CirclePlus className="h-6 w-6" strokeWidth={1.7} />
                </button>
              </article>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_0.8fr]">
            <div className="rounded-3xl border border-white/6 bg-white/[0.02] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-semibold tracking-tight text-white">Ecualización por Segmento</h2>
                <span className="self-start rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Preset: Vocal Punch
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-5">
                {eqBands.map((band) => (
                  <EqSlider key={band.id} band={band} />
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-[#1f314d] bg-[#162131] p-5">
              <h2 className="text-lg font-extrabold uppercase tracking-[0.08em] text-white">Detalles del Segmento</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-sm font-semibold text-slate-400">Nombre</span>
                  <span className="text-sm font-semibold text-[#60a5fa]">{activeSegment.label}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-sm font-semibold text-slate-400">Inicio</span>
                  <span className="text-sm font-semibold text-slate-200">{activeSegment.start}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                  <span className="text-sm font-semibold text-slate-400">Fin</span>
                  <span className="text-sm font-semibold text-slate-200">{activeSegment.end}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pb-2">
                  <span className="text-sm font-semibold text-slate-400">Duración</span>
                  <span className="text-sm font-semibold text-slate-200">00:31.82</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
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
