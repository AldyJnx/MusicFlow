import { useState } from 'react'
import { Heart, Mic, SendHorizontal, SlidersVertical, Sparkles } from 'lucide-react'

import ClientLayout from '../../layout/ClientLayout'

type QuickAction = {
  id: number
  label: string
  accent: string
  prompt: string
}

type ChatMessage = {
  id: number
  role: 'assistant' | 'user'
  content: string
}

const quickActions: QuickAction[] = [
  { id: 1, label: 'Limpiar Vocales', accent: 'text-amber-300', prompt: 'Quiero limpiar las vocales y reducir ruido.' },
  { id: 2, label: 'Estilo Analógico', accent: 'text-pink-300', prompt: 'Dale un color analógico y más calidez.' },
  { id: 3, label: 'Optimizar AirPods', accent: 'text-slate-300', prompt: 'Optimiza el sonido para escuchar en AirPods.' },
  { id: 4, label: 'Sonido Atmosférico', accent: 'text-sky-300', prompt: 'Quiero un sonido atmosférico y envolvente.' },
]

const bars = [42, 66, 84, 58, 31, 44, 72, 24]

const welcomeMessage =
  'Hola. Soy tu asistente de audio IA. Puedo ajustar la ecualización, profundidad y espacialidad de tu música en tiempo real. ¿Qué buscas hoy?'

const defaultReply =
  'Entendido. He aplicado un realce en las frecuencias sub-bajas (30Hz-80Hz) y un algoritmo de reverberación convolutiva de gran sala.'

export default function Agent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: welcomeMessage },
  ])
  const [input, setInput] = useState('')

  const hasGeneratedPreset = messages.some((message) => message.role === 'user')

  const handleSend = () => {
    const trimmed = input.trim()

    if (!trimmed) {
      return
    }

    setMessages((current) => [
      ...current,
      { id: current.length + 1, role: 'user', content: trimmed },
      { id: current.length + 2, role: 'assistant', content: defaultReply },
    ])
    setInput('')
  }

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(80,94,255,0.08),transparent_24%),linear-gradient(180deg,#14141b_0%,#131319_100%)] px-8 py-8 text-slate-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#132c58] text-[#4b8dff] shadow-[0_0_20px_rgba(59,130,246,0.18)]">
                    <Sparkles className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                ) : null}

                <div
                  className={`rounded-2xl px-5 py-4 text-lg leading-8 shadow-[0_12px_28px_rgba(0,0,0,0.18)] ${
                    message.role === 'assistant'
                      ? 'max-w-4xl border border-white/5 bg-[#1c1d24] text-slate-200'
                      : 'max-w-3xl border border-[#1f4f96] bg-[#12376e] text-slate-50 shadow-[0_16px_28px_rgba(18,55,110,0.22)]'
                  }`}
                >
                  {message.content}
                </div>

                {message.role === 'user' ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#205580] bg-[linear-gradient(180deg,#1b6ca5_0%,#123a5f_100%)] text-xs font-semibold text-white">
                    🎙
                  </div>
                ) : null}
              </div>
            ))}

            {hasGeneratedPreset ? (
              <article className="max-w-4xl rounded-[28px] border border-[#213664] bg-[linear-gradient(180deg,#171a27_0%,#17181e_100%)] p-5 shadow-[0_0_28px_rgba(59,130,246,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-[#3d77ff]">Preset Generado: Deep Cathedral</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Latencia: 12ms <span className="px-2">|</span> Espacialidad: 85%
                    </p>
                  </div>
                  <div className="text-[#3d77ff]">
                    <SlidersVertical className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                </div>

                <div className="mt-6 flex h-24 items-end gap-1.5 rounded-2xl bg-[#161923] px-5 pb-4 pt-3">
                  {bars.map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-[linear-gradient(180deg,rgba(72,116,212,0.95)_0%,rgba(55,87,158,0.72)_100%)]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[linear-gradient(90deg,#356cf5_0%,#6766f4_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.24)] transition hover:brightness-110"
                  >
                    Aplicar Ahora
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#171922] text-slate-400 transition hover:text-white"
                  >
                    <Heart className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                </div>
              </article>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setInput(action.prompt)}
                  className="rounded-full border border-white/8 bg-[#181920] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/15 hover:text-white"
                >
                  <span className={action.accent}>✦</span>
                  <span className="ml-2">{action.label}</span>
                </button>
              ))}
            </div>

            <form
              className="mt-6 rounded-2xl border border-white/6 bg-[#181920] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              onSubmit={(event) => {
                event.preventDefault()
                handleSend()
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:text-slate-200"
                >
                  <Mic className="h-4 w-4" strokeWidth={1.9} />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Quiero más bajos y sonido profundo..."
                  className="h-12 flex-1 bg-transparent text-[15px] text-slate-300 outline-none placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#4c74ff_0%,#5166f3_100%)] text-white shadow-[0_10px_24px_rgba(81,102,243,0.24)] transition hover:brightness-110"
                >
                  <SendHorizontal className="h-5 w-5" strokeWidth={2.1} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
}
