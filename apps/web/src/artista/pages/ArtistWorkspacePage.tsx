import { BarChart3, Disc3 } from "lucide-react";

export default function ArtistWorkspacePage({
  view,
}: {
  view: "releases" | "analytics";
}) {
  const analytics = view === "analytics";
  const Icon = analytics ? BarChart3 : Disc3;
  const title = analytics ? "Analítica de artista" : "Lanzamientos";
  const description = analytics
    ? "Las métricas de audiencia de tus lanzamientos aparecerán aquí cuando el perfil de artista esté vinculado al catálogo."
    : "Aquí podrás preparar y administrar tus próximos lanzamientos cuando se habilite la publicación de artistas.";

  return (
    <main className="min-h-full px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <Icon className="h-8 w-8 text-[var(--color-primary)]" />
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </main>
  );
}
