import type { ReactNode } from 'react'
import { AudioLines, CheckCircle2, CircleDot, Palette, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import ClientLayout from '../layout/ClientLayout'
import { usePreferences } from '../../shared/hooks/usePreferences'
import type { AppThemeId } from '../../shared/utils/theme'

type ThemeOption = {
  id: AppThemeId
  name: string
  description: string
  previewClassName: string
  dotsClassName: string[]
}

const themeOptions: ThemeOption[] = [
  {
    id: 'sonic-dark',
    name: 'Sonic Dark',
    description: 'Tema actual',
    previewClassName: 'bg-[linear-gradient(180deg,#13203f_0%,#09111f_100%)]',
    dotsClassName: ['bg-[#3b82f6]', 'bg-white/20'],
  },
  {
    id: 'neon-genesis',
    name: 'Neon Genesis',
    description: 'Estilo energico',
    previewClassName: 'bg-[linear-gradient(180deg,#44176c_0%,#2b0f48_100%)]',
    dotsClassName: ['bg-[#d05cff]', 'bg-[#b379ff]'],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    description: 'Claridad tecnica',
    previewClassName: 'bg-[linear-gradient(180deg,#cfd7e3_0%,#eef2f7_100%)]',
    dotsClassName: ['bg-[#334155]', 'bg-[#94a3b8]'],
  },
]

function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-3 text-[var(--color-text)]">
      <span className="text-[var(--color-primary)]">{icon}</span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

function Toggle({
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
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface-alt)]'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [normalizeVolume, setNormalizeVolume] = useState(true)
  const [gaplessPlayback, setGaplessPlayback] = useState(true)
  const { theme: activeTheme, setTheme } = usePreferences()

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-5">
            <SectionTitle icon={<Palette className="h-4 w-4" strokeWidth={2.3} />} title="Temas Visuales" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {themeOptions.map((option) => (
                <article
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`cursor-pointer rounded-2xl border bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] ${
                    option.id === activeTheme
                      ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div className={`h-24 rounded-xl ${option.previewClassName}`} />

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {option.dotsClassName.map((dotClassName) => (
                        <span key={dotClassName} className={`h-3 w-3 rounded-full ${dotClassName}`} />
                      ))}
                    </div>

                    {option.id === activeTheme ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.5} />
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{option.name}</h3>
                    <p className="text-sm text-[var(--color-muted)]">{option.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <SectionTitle icon={<AudioLines className="h-4 w-4" strokeWidth={2.3} />} title="Opciones de Audio" />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Calidad de Streaming</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Define el bitrate de la transmision</p>
                  </div>

                  <span className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    Premium (320 kbps)
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Normalizar Volumen</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Mismo nivel para todas las pistas</p>
                  </div>

                  <Toggle enabled={normalizeVolume} onToggle={() => setNormalizeVolume((current) => !current)} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle
                icon={<CircleDot className="h-4 w-4" strokeWidth={2.3} />}
                title="Preferencias de Reproduccion"
              />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Transicion (Crossfade)</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Superposicion entre canciones</p>
                    </div>

                    <span className="text-sm font-semibold text-[var(--color-primary)]">6.5 s</span>
                  </div>

                  <div className="mt-5 h-1.5 rounded-full bg-[var(--color-border)]">
                    <div className="relative h-full w-[58%] rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-primary)_100%)]">
                      <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">Reproduccion sin espacios</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Para albumes conceptuales</p>
                  </div>

                  <Toggle enabled={gaplessPlayback} onToggle={() => setGaplessPlayback((current) => !current)} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">Motor de Audio Avanzado</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                Ajusta la salida de audio de bajo nivel para interfaces profesionales.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-secondary)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,118,255,0.35)] transition hover:brightness-110"
                >
                  Configurar ASIO / CoreAudio
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
                >
                  Restaurar valores de fabrica
                </button>
              </div>
            </div>

            <div className="hidden rounded-2xl bg-[var(--color-surface-alt)] p-5 text-[var(--color-muted)] lg:block">
              <SlidersHorizontal className="h-20 w-20" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
