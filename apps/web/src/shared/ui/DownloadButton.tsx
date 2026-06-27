import { CheckCircle2, Download, Loader2 } from "lucide-react";

import {
  useDownloadsStore,
  type DownloadableTrack,
} from "../stores/downloadsStore";

/**
 * Toggles offline availability for a track. Not-downloaded → download;
 * in-progress → spinner; downloaded → green check (click to remove).
 * Requires a `url`, so it no-ops for tracks without a streamable source.
 */
export default function DownloadButton({
  track,
  size = 16,
  className = "",
}: {
  track: DownloadableTrack;
  size?: number;
  className?: string;
}) {
  const item = useDownloadsStore((s) => s.items[track.id]);
  const progress = useDownloadsStore((s) => s.progress[track.id]);
  const download = useDownloadsStore((s) => s.download);
  const remove = useDownloadsStore((s) => s.remove);

  if (!track.url) return null;

  const downloading = progress != null;
  const downloaded = !!item;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (downloading) return;
        if (downloaded) void remove(track.id);
        else void download(track);
      }}
      title={
        downloaded
          ? "Descargado · quitar"
          : downloading
            ? "Descargando…"
            : "Descargar para sin conexión"
      }
      aria-label={downloaded ? "Quitar descarga" : "Descargar"}
      className={`inline-flex items-center justify-center transition hover:scale-110 ${
        downloaded
          ? "text-[var(--color-success)]"
          : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
      } ${className}`}
    >
      {downloading ? (
        <Loader2
          className="animate-spin"
          style={{ width: size, height: size }}
          strokeWidth={2.2}
        />
      ) : downloaded ? (
        <CheckCircle2 style={{ width: size, height: size }} strokeWidth={2.2} />
      ) : (
        <Download style={{ width: size, height: size }} strokeWidth={2.2} />
      )}
    </button>
  );
}
