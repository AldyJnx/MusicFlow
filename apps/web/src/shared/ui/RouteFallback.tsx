import { Loader2 } from "lucide-react";

/** Centered spinner shown while a lazily-loaded route chunk is fetched. */
export default function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-page)]">
      <Loader2
        className="h-6 w-6 animate-spin text-[var(--color-muted)]"
        strokeWidth={1.8}
      />
    </div>
  );
}
