import { SlidersHorizontal, Sparkles, Waves, Mic2, Radio, Plus } from 'lucide-react'
import { useState } from 'react'

import ClientLayout from '../../layout/ClientLayout'

type EqualizerMode = 'Global' | 'Playlist' | 'Cancion' | 'Segmento'

type PresetCard = {
  id: number
  title: string
  subtitle: string
  icon: typeof Waves
  accent?: boolean
}

const modes: EqualizerMode[] = ['Global', 'Playlist', 'Cancion', 'Segmento']

const chartPoints = [
  { label: '20 Hz', x: '12%', y: '58%', active: false },
  { label: '250 Hz', x: '27%', y: '33%', active: false },
  { label: '1 KHz', x: '42%', y: '48%', active: false },
  { label: '4 KHz', x: '57%', y: '18%', active: true },
  { label: '20 KHz', x: '78%', y: '53%', active: false },
]

const presets: PresetCard[] = [
  {
    id: 1,
    title: 'Clasico',
    subtitle: 'Balanceado para acusticos',
    icon: Radio,
  },
  {
    id: 2,
    title: 'Deep Bass',
    subtitle: 'Potencia en graves',
    icon: Waves,
  },
  {
    id: 3,
    title: 'Vocal Live',
    subtitle: 'Claridad en medias',
    icon: Mic2,
  },
  {
    id: 4,
    title: 'Nuevo',
    subtitle: 'Guardar actual',
    icon: Plus,
    accent: true,
  },
]

function MasterSlider({
  label,
  value,
  width,
  muted = false,
}: {
  label: string
  value: string
  width: string
  muted?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em]">
        <span className="text-[var(--color-muted)]">{label}</span>
        <span className={muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-primary)]'}>{value}</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--color-border)]">
        <div
          className={`h-full rounded-full ${muted ? 'bg-white/40' : 'bg-[linear-gradient(90deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)]'}`}
          style={{ width }}
        />
      </div>
    </div>
  )
}

export default function Equalizer() {
  const [activeMode, setActiveMode] = useState<EqualizerMode>('Global')

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-[42px]">
                Ecualizador Paramétrico
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-[var(--color-muted)] sm:text-base">
                Ajusta cada frecuencia con precisión quirúrgica o deja que nuestra IA optimice el perfil sonoro según tu entorno.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.1} />
              Usar IA
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_0.86fr]">
            <div className="space-y-5">
              <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
                {modes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveMode(mode)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      activeMode === mode
                        ? 'bg-[var(--color-secondary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-secondary)_0%,rgba(13,22,40,0.92)_100%)]">
                <div className="relative h-[290px]">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                      backgroundSize: '44px 48px',
                    }}
                  />

                  <div
                    className="absolute inset-x-0 bottom-0 top-10 opacity-80"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(80,120,255,0.08) 0%, rgba(80,120,255,0.03) 100%)',
                      clipPath:
                        'polygon(0% 62%, 12% 54%, 27% 31%, 42% 49%, 57% 12%, 72% 46%, 85% 68%, 100% 52%, 100% 100%, 0% 100%)',
                    }}
                  />

                  {chartPoints.map((point) => (
                    <span
                      key={point.label}
                      className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                        point.active
                          ? 'bg-white shadow-[0_0_24px_rgba(255,255,255,0.82)]'
                          : 'bg-[var(--color-primary)] shadow-[0_0_20px_rgba(96,165,250,0.65)]'
                      }`}
                      style={{ left: point.x, top: point.y }}
                    />
                  ))}

                  <div className="absolute inset-x-6 bottom-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {chartPoints.map((point) => (
                      <span key={point.label}>{point.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {presets.map((preset) => {
                  const Icon = preset.icon

                  return (
                    <article
                      key={preset.id}
                      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                    >
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                          preset.accent
                            ? 'bg-[var(--color-secondary)] text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.1} />
                      </div>
                      <h3 className={`mt-5 text-base font-semibold ${preset.accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                        {preset.title}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{preset.subtitle}</p>
                    </article>
                  )
                })}
              </div>
            </div>

            <aside className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Ajustes Maestros</h2>
              <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                <div className="space-y-6">
                  <MasterSlider label="Bajos" value="+4.5 dB" width="76%" />
                  <MasterSlider label="Agudos" value="-1.2 dB" width="45%" />
                  <MasterSlider label="Reverb" value="15%" width="18%" muted />
                  <MasterSlider label="Compresión" value="Moderada" width="60%" />
                </div>

                <div className="mt-8 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em]">
                    <span className="inline-flex items-center gap-2 text-white">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      Volumen General
                    </span>
                    <span className="text-[var(--color-primary)]">82%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-border)]">
                    <div className="relative h-full w-[82%] rounded-full bg-white">
                      <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4 text-sm leading-6 text-[var(--color-muted)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-[var(--color-surface-alt)] p-1 text-[var(--color-primary)]">
                      <SlidersHorizontal className="h-4 w-4" strokeWidth={2.1} />
                    </div>
                    <p>
                      Los ajustes se aplican en tiempo real. Activa el{' '}
                      <span className="font-semibold text-[var(--color-text)]">Modo High-Res</span> en configuración para mayor fidelidad.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
