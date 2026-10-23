import {
  Bell,
  Database,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import PersonalizationSection from "../../client/features/settings/PersonalizationSection";
import { useAuthStore } from "../../shared/stores/authStore";
import PreferencesMenu from "../../shared/ui/PreferencesMenu";

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
  const user = useAuthStore((state) => state.user);
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SettingCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Cuenta administrativa"
            description="Identidad con la que administras MusicFlow."
          >
            <div className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
              <p className="font-semibold">
                {user?.username ?? "Administrador"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {user?.email ?? ""} · Administrador
              </p>
            </div>
          </SettingCard>
          <SettingCard
            icon={<LockKeyhole className="h-5 w-5" />}
            title="Seguridad y acceso"
            description="Revisa usuarios, roles y el estado de sus cuentas."
          >
            <Link
              to="/admin/users"
              className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Gestionar usuarios y roles
            </Link>
          </SettingCard>
          <SettingCard
            icon={<Database className="h-5 w-5" />}
            title="Catálogo"
            description="Administra artistas, álbumes, canciones, letras y géneros."
          >
            <Link
              to="/admin/catalog"
              className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Abrir catálogo
            </Link>
          </SettingCard>
          <SettingCard
            icon={<Bell className="h-5 w-5" />}
            title="Operación IA"
            description="Consulta consumo, solicitudes y trazabilidad del agente."
          >
            <Link
              to="/admin/ai"
              className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Ver solicitudes IA
            </Link>
          </SettingCard>
          <SettingCard
            icon={<Users className="h-5 w-5" />}
            title="Roles"
            description="Los permisos se aplican desde el listado de usuarios, no solo en la interfaz."
          >
            <Link
              to="/admin/users"
              className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              Configurar accesos
            </Link>
          </SettingCard>
          <SettingCard
            icon={<Palette className="h-5 w-5" />}
            title="Tema"
            description="Cambia la apariencia general del panel."
          >
            <PreferencesMenu />
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
