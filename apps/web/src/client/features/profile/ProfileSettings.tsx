import {
  AudioLines,
  Clock3,
  MapPin,
  Mic2,
  Music2,
  Music4,
  Play,
  Settings2,
  Save,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import ClientLayout from "../../layout/ClientLayout";
import {
  useListeningStatsQuery,
  useRecentlyPlayedQuery,
} from "../../../shared/hooks/useAnalytics";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import { useAuthStore } from "../../../shared/stores/authStore";
import type { Track } from "../../../shared/api/tracks";
import { getAvatarUrl } from "../../../shared/utils/avatar";
import { updateMyProfile } from "../../../shared/api/auth";
import {
  formatTrackArtist,
  toPlayerFeaturedArtists,
} from "../../../shared/utils/trackArtist";

function toPlayerTrack(t: Track): PlayerTrack | null {
  if (!t.fileUrlRemote) return null;
  return {
    id: t.id,
    title: t.title,
    artistProfileName: t.artist,
    artist: formatTrackArtist(t.artist, t.featuredArtists),
    featuredArtists: toPlayerFeaturedArtists(t.featuredArtists),
    cover: t.coverArt,
    url: t.fileUrlRemote,
    durationMs: t.durationMs,
  };
}

/** Format a millisecond total as "12h 30m" / "45m" / "0m". */
function formatListenTime(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const statsQ = useListeningStatsQuery("ALL_TIME");
  const recentQ = useRecentlyPlayedQuery(4);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const avatarUrl = getAvatarUrl(user?.avatar);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar]);

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  const saveProfile = useMutation({
    mutationFn: () => updateMyProfile({ username: username.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
      setNotice({ tone: "success", message: "Perfil actualizado con éxito." });
    },
    onError: () => {
      setNotice({
        tone: "error",
        message:
          "No se pudo guardar el cambio. Verifica que el nombre esté disponible.",
      });
    },
  });

  const stats = statsQ.data;
  const recent = recentQ.data ?? [];
  const loading = statsQ.isPending;
  const dash = "—";

  const mostPlayedTrack = stats?.topTracks[0];
  const statCards = [
    {
      id: 1,
      label: "Tiempo de escucha",
      value: loading ? dash : formatListenTime(Number(stats?.totalTimeMs ?? 0)),
      icon: Clock3,
      accent: "text-sky-400",
    },
    {
      id: 2,
      label: "Canciones reproducidas",
      value: loading ? dash : (stats?.totalPlays ?? 0).toLocaleString("es"),
      icon: Music2,
      accent: "text-blue-400",
    },
    {
      id: 3,
      label: "Último artista seguido",
      value: loading ? dash : (stats?.latestFollowedArtist?.name ?? dash),
      icon: Users,
      accent: "text-violet-400",
    },
    {
      id: 4,
      label: "Canción más escuchada",
      value: loading ? dash : (mostPlayedTrack?.title ?? dash),
      detail: loading ? undefined : mostPlayedTrack?.artist,
      icon: AudioLines,
      accent: "text-emerald-400",
    },
  ];

  const topArtists = stats?.topArtists ?? [];
  const maxArtistCount = topArtists.reduce(
    (max, a) => Math.max(max, a.count),
    0,
  );

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(91,64,255,0.12),transparent_22%),linear-gradient(180deg,#14151d_0%,#111218_100%)] px-6 py-8 text-slate-100 xl:px-8">
        {notice ? (
          <div
            className={`fixed left-1/2 top-5 z-[100] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${notice.tone === "error" ? "border-rose-400/50 bg-rose-950 text-rose-100" : "border-emerald-400/50 bg-emerald-950 text-emerald-100"}`}
            role="status"
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded px-2 py-1 text-xs underline"
            >
              Cerrar
            </button>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="rounded-[28px] border border-white/6 bg-[#171922] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(104,80,255,0.45),transparent_65%)] blur-xl" />
                    <div
                      className="relative flex h-40 w-40 items-center justify-center rounded-full border border-[#23263b] bg-[#202637] text-slate-300 shadow-[0_0_0_6px_rgba(26,29,42,0.9),0_0_30px_rgba(99,102,241,0.24)]"
                      aria-label="Avatar de usuario"
                    >
                      {avatarUrl && !avatarFailed ? (
                        <img
                          src={avatarUrl}
                          alt={`Foto de ${user?.username ?? "usuario"}`}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarFailed(true)}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-16 w-16" strokeWidth={1.5} />
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-3 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition hover:brightness-110"
                    >
                      <Settings2 className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {user?.isPremium ? (
                      <span className="inline-flex rounded-full border border-[#27467f] bg-[#17253f] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#68a0ff]">
                        Premium Member
                      </span>
                    ) : null}
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[40px]">
                        {user?.username ?? "Tu perfil"}
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin
                            className="h-4 w-4 text-slate-500"
                            strokeWidth={2}
                          />
                          {user?.email ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    Editar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <article
                      key={stat.id}
                      className="rounded-[22px] border border-[#1f2838] bg-[#151923] px-5 py-5 shadow-[0_0_0_1px_rgba(44,112,255,0.04),0_0_24px_rgba(0,190,255,0.05)]"
                    >
                      <Icon
                        className={`h-5 w-5 ${stat.accent}`}
                        strokeWidth={2.2}
                      />
                      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                        {stat.value}
                      </p>
                      {stat.detail ? (
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {stat.detail}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
            <article className="rounded-[28px] border border-white/6 bg-[#171c26] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-white">
                  <Mic2 className="h-5 w-5 text-[#68a0ff]" strokeWidth={2.1} />
                  Artistas más escuchados
                </h2>
              </div>

              {topArtists.length === 0 ? (
                <div className="mt-10 grid min-h-[200px] place-items-center text-center">
                  <p className="max-w-xs text-sm text-slate-500">
                    Todavía no hay datos. Reproducí algunas canciones y tus
                    artistas más escuchados aparecerán acá.
                  </p>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-4">
                  {topArtists.slice(0, 6).map((artist) => (
                    <div key={artist.name} className="flex items-center gap-4">
                      <span className="w-32 shrink-0 truncate text-sm font-medium text-slate-200">
                        {artist.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#6da8ff_0%,#7fd7ff_100%)] shadow-[0_0_16px_rgba(96,165,250,0.5)]"
                          style={{
                            width: `${maxArtistCount > 0 ? Math.max(8, (artist.count / maxArtistCount) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-slate-500">
                        {artist.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <aside className="rounded-[28px] border border-dashed border-[#2e5da8] bg-[#171c26] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-white">
                <Clock3 className="h-5 w-5 text-[#68a0ff]" strokeWidth={2.1} />
                Actividad reciente
              </h2>

              {recent.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  Sin reproducciones recientes.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {recent.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        const p = toPlayerTrack(track);
                        if (p) void playTrack(p);
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl p-1.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                        {track.coverArt ? (
                          <img
                            src={track.coverArt}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Music4
                            className="absolute inset-0 m-auto h-6 w-6 text-slate-500"
                            strokeWidth={1.5}
                          />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                          <Play
                            className="h-5 w-5 text-white"
                            strokeWidth={2.4}
                            fill="currentColor"
                          />
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-lg font-semibold tracking-tight text-white">
                          {track.title}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-500">
                          {track.artist}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/library?scope=mylibrary")}
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                Ver mi biblioteca
              </button>
            </aside>
          </div>
        </div>
      </section>
      {editing ? (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveProfile.mutate();
            }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171922] p-6 shadow-2xl"
          >
            <h2
              id="edit-profile-title"
              className="text-xl font-black text-white"
            >
              Editar perfil
            </h2>
            <label className="mt-5 block text-sm font-semibold text-slate-200">
              Nombre de usuario
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={30}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#11131a] px-4 py-3 text-white outline-none focus:border-[#68a0ff]"
            />
            <p className="mt-2 text-xs text-slate-500">
              Entre 3 y 30 caracteres. El nombre debe ser único.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  saveProfile.isPending || username.trim() === user?.username
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                {saveProfile.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ClientLayout>
  );
}
