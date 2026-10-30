import { Palette, PanelLeft } from "lucide-react";
import type { ReactNode } from "react";

import PersonalizationSection from "../../client/features/settings/PersonalizationSection";
import { usePreferences } from "../../shared/hooks/usePreferences";
import { APP_THEMES } from "../../shared/utils/theme";

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {description}
          </p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </article>
  );
}

export default function AdminSettingsPage() {
  const { theme, setTheme, sidebarPosition, setSidebarPosition } =
    usePreferences();
  return (
    <section className="min-h-screen bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Panel administrativo
          </p>
          <h1 className="mt-1 text-3xl font-bold">Configuración</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Gestiona tu cuenta, personalización y accesos administrativos.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          <SettingCard
            icon={<Palette className="h-5 w-5" />}
            title="Tema visual"
            description="Elige la apariencia completa que se aplica al panel administrativo."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {APP_THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`rounded-xl border p-2 text-left transition ${
                    theme === option.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <span
                    className={`block h-9 rounded-lg ${option.previewClassName}`}
                  />
                  <span className="mt-2 block text-xs font-bold capitalize">
                    {option.id.replaceAll("-", " ")}
                  </span>
                </button>
              ))}
            </div>
          </SettingCard>
          <SettingCard
            icon={<PanelLeft className="h-5 w-5" />}
            title="Posición del sidebar"
            description="Define el lado donde aparece la navegación administrativa."
          >
            <div className="inline-flex rounded-xl border border-[var(--color-border)] p-1">
              {(["left", "right"] as const).map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setSidebarPosition(position)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    sidebarPosition === position
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {position === "left" ? "Izquierda" : "Derecha"}
                </button>
              ))}
            </div>
          </SettingCard>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <h2 className="font-semibold">Personalización avanzada</h2>
              <p className="text-sm text-[var(--color-muted)]">
                Densidad, acento, distribución del sidebar, reproductor y
                vistas.
              </p>
            </div>
          </div>
          <PersonalizationSection />
        </div>
      </div>
    </section>
  );
}
