import type { ReactNode } from 'react'
import { AudioLines, CheckCircle2, CircleDot, Palette, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import ClientLayout from '../layout/ClientLayout'

type ThemeOption = {
  id: number
  name: string
  description: string
  previewClassName: string
  dotsClassName: string[]
  active?: boolean
}

const themeOptions: ThemeOption[] = [
  {
    id: 1,
    name: 'Sonic Dark',
    description: 'Tema actual',
    previewClassName: 'bg-[linear-gradient(180deg,#13203f_0%,#09111f_100%)]',
    dotsClassName: ['bg-[#3b82f6]', 'bg-white/20'],
    active: true,
  },
  {
    id: 2,
    name: 'Neon Genesis',
    description: 'Estilo energico',
    previewClassName: 'bg-[linear-gradient(180deg,#44176c_0%,#2b0f48_100%)]',
    dotsClassName: ['bg-[#d05cff]', 'bg-[#b379ff]'],
  },
  {
    id: 3,
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
    <div className="flex items-center gap-3 text-white">
      <span className="text-[#3b82f6]">{icon}</span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled ? 'border-[#2563eb] bg-[#2563eb]' : 'border-white/10 bg-white/10'
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
  const [normalizeVolume] = useState(true)
  const [gaplessPlayback] = useState(true)

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[#111218] px-4 py-6 text-slate-100 sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[28px] border border-white/5 bg-[linear-gradient(180deg,rgba(20,22,31,0.98)_0%,rgba(15,16,24,0.98)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-5">
            <SectionTitle icon={<Palette className="h-4 w-4" strokeWidth={2.3} />} title="Temas Visuales" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {themeOptions.map((theme) => (
                <article
                  key={theme.id}
                  className={`rounded-2xl border bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04] ${
                    theme.active
                      ? 'border-[#3b82f6] shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'
                      : 'border-white/6'
                  }`}
                >
                  <div className={`h-24 rounded-xl ${theme.previewClassName}`} />

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {theme.dotsClassName.map((dotClassName) => (
                        <span key={dotClassName} className={`h-3 w-3 rounded-full ${dotClassName}`} />
                      ))}
                    </div>

                    {theme.active ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3b82f6]" strokeWidth={2.5} />
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{theme.name}</h3>
                    <p className="text-sm text-slate-500">{theme.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <SectionTitle icon={<AudioLines className="h-4 w-4" strokeWidth={2.3} />} title="Opciones de Audio" />

              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">Calidad de Streaming</h3>
                    <p className="mt-1 text-sm text-slate-500">Define el bitrate de la transmision</p>
                  </div>

                  <span className="rounded-lg border border-[#2563eb]/25 bg-[#2563eb]/10 px-3 py-1 text-xs font-semibold text-[#3b82f6]">
                    Premium (320 kbps)
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">Normalizar Volumen</h3>
                    <p className="mt-1 text-sm text-slate-500">Mismo nivel para todas las pistas</p>
                  </div>

                  <Toggle enabled={normalizeVolume} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle
                icon={<CircleDot className="h-4 w-4" strokeWidth={2.3} />}
                title="Preferencias de Reproduccion"
              />

              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                <div className="border-b border-white/6 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-white">Transicion (Crossfade)</h3>
                      <p className="mt-1 text-sm text-slate-500">Superposicion entre canciones</p>
                    </div>

                    <span className="text-sm font-semibold text-[#3b82f6]">6.5 s</span>
                  </div>

                  <div className="mt-5 h-1.5 rounded-full bg-white/8">
                    <div className="relative h-full w-[58%] rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#3b82f6_100%)]">
                      <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#3b82f6]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">Reproduccion sin espacios</h3>
                    <p className="mt-1 text-sm text-slate-500">Para albumes conceptuales</p>
                  </div>

                  <Toggle enabled={gaplessPlayback} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-6 rounded-3xl border border-white/6 bg-white/[0.02] p-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Motor de Audio Avanzado</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                Ajusta la salida de audio de bajo nivel para interfaces profesionales.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-[linear-gradient(180deg,#3576ff_0%,#2d5fe6_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(53,118,255,0.35)] transition hover:brightness-110"
                >
                  Configurar ASIO / CoreAudio
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  Restaurar valores de fabrica
                </button>
              </div>
            </div>

            <div className="hidden rounded-2xl bg-white/[0.02] p-5 text-white/12 lg:block">
              <SlidersHorizontal className="h-20 w-20" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
