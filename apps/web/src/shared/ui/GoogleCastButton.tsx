import { Cast, Loader2 } from "lucide-react";
import { googleCast } from "../cast/googleCast";
import { useGoogleCast } from "../hooks/useGoogleCast";

type GoogleCastButtonProps = {
  className?: string;
};

export default function GoogleCastButton({ className }: GoogleCastButtonProps) {
  const cast = useGoogleCast();

  const connected = cast.connection === "connected";
  const connecting = cast.connection === "connecting";
  const unavailable = cast.availability === "unsupported";
  const title = connected
    ? "Desconectar Google Cast"
    : unavailable
      ? "Google Cast requiere Chrome/Chromium por HTTPS y un Receiver ID configurado"
      : cast.availability === "no-devices"
        ? "Buscar dispositivos Google Cast"
        : "Transmitir con Google Cast";

  return (
    <button
      type="button"
      data-testid="google-cast-button"
      aria-label={title}
      title={title}
      onClick={() => {
        if (connected) {
          googleCast.disconnect();
          return;
        }
        void googleCast.requestSession().catch(() => undefined);
      }}
      disabled={connecting || unavailable}
      className={className}
    >
      {connecting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Cast
          className={`h-5 w-5 ${connected ? "text-[var(--color-primary)]" : unavailable ? "opacity-45" : ""}`}
        />
      )}
    </button>
  );
}
