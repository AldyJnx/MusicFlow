import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Save, ShieldCheck, UserRound } from "lucide-react";

import { updateMyProfile, uploadMyAvatar } from "../../shared/api/auth";
import { useAuthStore } from "../../shared/stores/authStore";
import { getAvatarUrl } from "../../shared/utils/avatar";
import { showActionNotice } from "../../shared/ui/ActionNotice";

export default function AdminProfilePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [imageFailed, setImageFailed] = useState(false);
  const isDirty =
    username.trim() !== user?.username || bio.trim() !== (user?.bio ?? "");

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({ username: username.trim(), bio: bio.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      showActionNotice("Perfil administrativo actualizado.");
    },
    onError: () => showActionNotice("No se pudo guardar el perfil.", "error"),
  });
  const avatarMutation = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: (updated) => {
      setUser(updated);
      setImageFailed(false);
      showActionNotice("Foto de perfil actualizada.");
    },
    onError: () =>
      showActionNotice("No se pudo subir la foto de perfil.", "error"),
  });

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 text-[var(--color-primary)]" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Mi Perfil
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Información de tu cuenta administrativa de MusicFlow.
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-page)]">
              {getAvatarUrl(user?.avatar) && !imageFailed ? (
                <img
                  src={getAvatarUrl(user?.avatar)!}
                  alt="Foto de perfil"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="m-auto h-full w-12 text-[var(--color-muted)]" />
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={avatarMutation.isPending}
                aria-label="Cambiar foto de perfil"
                className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-center bg-black/65 text-white transition hover:bg-black/80"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/webp,image/avif,image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) avatarMutation.mutate(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                Administrador
              </p>
              <p className="mt-1 text-xl font-semibold">
                {user?.username ?? "Administrador"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {user?.email}
              </p>
            </div>
          </div>

          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (isDirty) saveMutation.mutate();
            }}
          >
            <label className="grid gap-2 text-sm font-semibold">
              Nombre de usuario
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={30}
                required
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 font-normal outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Biografía pública
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="Describe tu función dentro de MusicFlow…"
                className="resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 font-normal outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isDirty || saveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-primary-contrast)] disabled:opacity-45"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
