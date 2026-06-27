import { Music4 } from "lucide-react";
import { useEffect, useState } from "react";

import { resolveCoverUrl } from "../stores/downloadsStore";
import { resolveLocalCover } from "../offline/localLibrary";

/**
 * Renders an offline cover from a locally-stored blob (works with no network).
 * `source` picks the store: a download or a local file. Falls back to a music
 * icon when no cover was cached.
 */
export default function OfflineCover({
  id,
  className = "",
  source = "download",
}: {
  id: string;
  className?: string;
  source?: "download" | "local";
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const resolver = source === "local" ? resolveLocalCover : resolveCoverUrl;
    void resolver(id).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [id, source]);

  if (url) {
    return <img src={url} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-[var(--color-surface-alt)] ${className}`}
    >
      <Music4 className="h-4 w-4 text-[var(--color-muted)]" strokeWidth={1.8} />
    </div>
  );
}
