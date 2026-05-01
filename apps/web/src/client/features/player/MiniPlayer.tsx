import {
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { usePlayerStore } from '../../stores/playStore'

type MiniPlayerProps = {
  sidebarOffset?: number
}

export default function MiniPlayer({ sidebarOffset = 0 }: MiniPlayerProps) {
  const currentTrack = usePlayerStore((store) => store.currentTrack)
  const isOpen = usePlayerStore((store) => store.isOpen)
  const isPlaying = usePlayerStore((store) => store.isPlaying)
  const volume = usePlayerStore((store) => store.volume)
  const progress = usePlayerStore((store) => store.progress)
  const currentTime = usePlayerStore((store) => store.currentTime)
  const togglePlay = usePlayerStore((store) => store.togglePlay)
  const setVolume = usePlayerStore((store) => store.setVolume)

  if (!isOpen || !currentTrack) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-0 z-40 px-6"
      style={{ left: `${sidebarOffset}px` }}
    >
      <div className="mx-auto grid w-[min(100%,1040px)] grid-cols-[minmax(0,1fr)_minmax(360px,1.2fr)_minmax(180px,1fr)] items-center gap-4 rounded-[24px] border border-white/6 bg-[#12202d] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <img src={currentTrack.cover} alt={currentTrack.title} className="h-14 w-14 rounded-xl object-cover" />

          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight text-white">{currentTrack.title}</h2>
            <p className="truncate text-sm text-[#5ea0ff]">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2.5">
          <div className="flex items-center gap-5 text-slate-400">
            <button type="button" className="transition hover:text-white">
              <SkipBack className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111827] shadow-[0_8px_20px_rgba(255,255,255,0.14)] transition hover:scale-[1.02]"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Play className="ml-0.5 h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
            <button type="button" className="transition hover:text-white">
              <SkipForward className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button type="button" className="transition hover:text-white">
              <Repeat className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex w-full items-center gap-3">
            <span className="w-9 text-right text-xs font-medium text-slate-500">{currentTime}</span>
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2f77ff_0%,#57a6ff_100%)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-9 text-xs font-medium text-slate-500">{currentTrack.duration}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-slate-400">
          <button type="button" className="transition hover:text-white">
            <Volume2 className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <div className="w-24">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="mini-player-slider h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10"
            />
          </div>
        </div>
      </div>

      <style>{`
        .mini-player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #6da8ff;
          border: 0;
          box-shadow: 0 0 0 2px rgba(109, 168, 255, 0.15);
        }

        .mini-player-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #6da8ff;
          border: 0;
          box-shadow: 0 0 0 2px rgba(109, 168, 255, 0.15);
        }
      `}</style>
    </div>
  )
}
