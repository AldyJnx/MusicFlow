import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Disc3,
  ImagePlus,
  Loader2,
  Music4,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";

import {
  assignTrack,
  createAlbum,
  createArtist,
  deleteAlbum,
  deleteArtist,
  getCatalogArtist,
  getTrackLyrics,
  listCatalogArtists,
  listCatalogGenres,
  updateArtist,
  updateTrackLyrics,
  uploadAlbumCover,
  uploadArtistImage,
  uploadCatalogTrack,
  uploadTrackCover,
  type CatalogArtist,
} from "../../shared/api/catalog";

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <input
        {...props}
        className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
      />
    </label>
  );
}

// A compact image picker that uploads on selection and refreshes on success.
function ImageUploadButton({
  onUpload,
  title,
  className = "",
}: {
  onUpload: (file: File) => Promise<unknown>;
  title: string;
  className?: string;
}) {
  const m = useMutation({ mutationFn: onUpload });
  return (
    <label
      title={title}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-glass)] text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${
        m.isPending ? "opacity-60" : ""
      } ${className}`}
    >
      {m.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ImagePlus className="h-4 w-4" />
      )}
      <input
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        disabled={m.isPending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) m.mutate(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

// ── Lyrics editor modal ────────────────────────────────────────────────────────
function LyricsModal({
  trackId,
  title,
  onClose,
}: {
  trackId: string;
  title: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [lrc, setLrc] = useState("");
  const [loaded, setLoaded] = useState(false);

  const lyricsQ = useQuery({
    queryKey: ["admin", "lyrics", trackId],
    queryFn: () => getTrackLyrics(trackId),
  });
  useEffect(() => {
    if (lyricsQ.data && !loaded) {
      setLrc(lyricsQ.data.lyricsLrc ?? lyricsQ.data.lyricsText ?? "");
      setLoaded(true);
    }
  }, [lyricsQ.data, loaded]);

  const save = useMutation({
    mutationFn: () => {
      const isLrc = /\[\d{1,2}:\d{2}/.test(lrc);
      return updateTrackLyrics(
        trackId,
        isLrc ? { lyricsLrc: lrc } : { lyricsText: lrc },
      );
    },
    onSuccess: onClose,
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
              {t("catalog.lyrics", { defaultValue: "Letra" })}
            </p>
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            {t("catalog.lyricsHintBefore", {
              defaultValue: "Pega la letra. Si usa marcas de tiempo",
            })}{" "}
            <code>[mm:ss.xx]</code>{" "}
            {t("catalog.lyricsHintAfter", {
              defaultValue:
                "se sincroniza con la reproducción; si no, se guarda como texto plano.",
            })}
          </p>
          {lyricsQ.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
            </div>
          ) : (
            <textarea
              value={lrc}
              onChange={(e) => setLrc(e.target.value)}
              rows={14}
              placeholder="[00:12.50] ..."
              className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-white/[0.04] p-3 font-mono text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-line)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {t("catalog.cancel", { defaultValue: "Cancelar" })}
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("catalog.saveLyrics", { defaultValue: "Guardar letra" })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Artist detail panel ────────────────────────────────────────────────────────
function ArtistEditor({ artistId }: { artistId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const artistQ = useQuery({
    queryKey: ["catalog", "artist", artistId],
    queryFn: () => getCatalogArtist(artistId),
  });
  const artist = artistQ.data;

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumYear, setAlbumYear] = useState("");
  const [lyricsTrack, setLyricsTrack] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const genreSuggestionsQ = useQuery({
    queryKey: ["catalog", "genres"],
    queryFn: listCatalogGenres,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (artist) {
      setName(artist.name);
      setImageUrl(artist.imageUrl ?? "");
      setBio(artist.bio ?? "");
      setGenres(artist.genres ?? []);
    }
  }, [artist]);

  function addGenre(raw: string) {
    const v = raw.trim();
    if (!v) return;
    setGenres((prev) =>
      prev.some((g) => g.toLowerCase() === v.toLowerCase())
        ? prev
        : [...prev, v].slice(0, 12),
    );
    setGenreInput("");
  }

  const uploadSong = useMutation({
    mutationFn: (file: File) =>
      uploadCatalogTrack(file, {
        artistId,
        albumId: uploadAlbumId || undefined,
      }),
    onSuccess: () => {
      setUploadError(null);
      invalidate();
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "No se pudo subir la canción.";
      setUploadError(msg);
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["catalog", "artist", artistId] });
    void qc.invalidateQueries({ queryKey: ["catalog", "artists"] });
  };

  const saveArtist = useMutation({
    mutationFn: () =>
      updateArtist(artistId, {
        name,
        imageUrl: imageUrl || undefined,
        bio: bio || undefined,
        genres,
      }),
    onSuccess: invalidate,
  });
  const addAlbum = useMutation({
    mutationFn: () =>
      createAlbum({
        title: albumTitle,
        artistId,
        year: albumYear ? Number(albumYear) : undefined,
      }),
    onSuccess: () => {
      setAlbumTitle("");
      setAlbumYear("");
      invalidate();
    },
  });
  const removeAlbum = useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: invalidate,
  });
  const assign = useMutation({
    mutationFn: (vars: { trackId: string; albumId: string | null }) =>
      assignTrack(vars.trackId, { albumId: vars.albumId }),
    onSuccess: invalidate,
  });

  if (artistQ.isLoading || !artist) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Artist header / edit */}
      <div className="flex gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-4">
        <div className="relative h-24 w-24 flex-none">
          <div className="h-full w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <ImageUploadButton
            title={t("catalog.uploadArtistImage", {
              defaultValue: "Subir foto del artista",
            })}
            onUpload={(f) => uploadArtistImage(artistId, f).then(invalidate)}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[var(--color-surface)]"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          <Field
            label={t("catalog.name", { defaultValue: "Nombre" })}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label={t("catalog.imageUrl", { defaultValue: "Imagen (URL)" })}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {t("catalog.bio", { defaultValue: "Bio" })}
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="resize-y rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          {/* Genres — an artist may belong to several. */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {t("catalog.genres", { defaultValue: "Géneros" })}
            </span>
            {genres.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]"
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() =>
                        setGenres((prev) => prev.filter((x) => x !== g))
                      }
                      className="opacity-70 hover:opacity-100"
                      aria-label={`Quitar ${g}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                list="catalog-genre-suggestions"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGenre(genreInput);
                  }
                }}
                placeholder={t("catalog.addGenrePlaceholder", {
                  defaultValue: "Agregar género (Enter)…",
                })}
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
              <datalist id="catalog-genre-suggestions">
                {(genreSuggestionsQ.data ?? []).map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => addGenre(genreInput)}
                disabled={!genreInput.trim()}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("catalog.add", { defaultValue: "Agregar" })}
              </button>
            </div>
          </div>

          <div className="col-span-2">
            <button
              type="button"
              onClick={() => saveArtist.mutate()}
              disabled={saveArtist.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
            >
              {saveArtist.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("catalog.saveArtist", { defaultValue: "Guardar artista" })}
            </button>
          </div>
        </div>
      </div>

      {/* Albums */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Disc3 className="h-4 w-4 text-[var(--color-accent)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
            {t("catalog.albums", {
              defaultValue: "Álbumes ({{count}})",
              count: artist.albums.length,
            })}
          </h3>
        </div>
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <Field
            label={t("catalog.albumTitle", {
              defaultValue: "Título del álbum",
            })}
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
          />
          <Field
            label={t("catalog.year", { defaultValue: "Año" })}
            type="number"
            value={albumYear}
            onChange={(e) => setAlbumYear(e.target.value)}
          />
          <button
            type="button"
            onClick={() => albumTitle && addAlbum.mutate()}
            disabled={!albumTitle || addAlbum.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />{" "}
            {t("catalog.createAlbum", { defaultValue: "Crear álbum" })}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {artist.albums.map((al) => (
            <div
              key={al.id}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-alt)] px-3 py-2"
            >
              <span className="h-9 w-9 flex-none overflow-hidden rounded-md bg-[var(--color-glass)]">
                {al.coverArt ? (
                  <img
                    src={al.coverArt}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Disc3 className="m-auto mt-2 h-4 w-4 text-[var(--color-muted)]" />
                )}
              </span>
              <ImageUploadButton
                title={t("catalog.uploadAlbumCover", {
                  defaultValue: "Subir portada del álbum",
                })}
                onUpload={(f) => uploadAlbumCover(al.id, f).then(invalidate)}
                className="h-8 w-8"
              />
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {al.title}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {al.year ? `${al.year} · ` : ""}
                {t("catalog.trackCountShort", {
                  defaultValue: "{{count}} canc.",
                  count: al.trackCount,
                })}
              </span>
              <button
                type="button"
                onClick={() => removeAlbum.mutate(al.id)}
                className="text-[var(--color-muted)] hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {artist.albums.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">
              {t("catalog.noAlbums", {
                defaultValue:
                  "Aún no hay álbumes. Crea uno y asigna canciones abajo.",
              })}
            </p>
          ) : null}
        </div>
      </div>

      {/* Tracks */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Music4 className="h-4 w-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
            {t("catalog.tracks", {
              defaultValue: "Canciones ({{count}})",
              count: artist.tracks.length,
            })}
          </h3>
        </div>

        {/* Upload a new catalog song for this artist (optionally into an album). */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <select
            value={uploadAlbumId}
            onChange={(e) => setUploadAlbumId(e.target.value)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] outline-none"
          >
            <option value="">
              {t("catalog.noAlbum", { defaultValue: "— Sin álbum —" })}
            </option>
            {artist.albums.map((al) => (
              <option key={al.id} value={al.id}>
                {al.title}
              </option>
            ))}
          </select>
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] ${
              uploadSong.isPending ? "opacity-60" : "hover:opacity-90"
            }`}
          >
            {uploadSong.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {t("catalog.uploadSong", { defaultValue: "Subir canción" })}
            <input
              type="file"
              accept="audio/*,.mp3,.flac,.wav,.m4a,.ogg,.aac,.opus"
              className="hidden"
              disabled={uploadSong.isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadSong.mutate(file);
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-[11px] text-[var(--color-muted)]">
            {t("catalog.uploadHint", {
              defaultValue:
                "Alta calidad sin recompresión (WAV/FLAC/MP3, hasta 100 MB). Se asigna al artista y, si eliges álbum, hereda su portada.",
            })}
          </span>
          {uploadError ? (
            <span className="w-full text-xs text-rose-400">{uploadError}</span>
          ) : null}
        </div>

        <div className="flex flex-col divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)]">
          {artist.tracks.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center gap-3 bg-[var(--color-glass)] px-3 py-2.5"
            >
              <div className="h-9 w-9 flex-none overflow-hidden rounded-md bg-[var(--color-surface-alt)]">
                {tr.coverArt ? (
                  <img
                    src={tr.coverArt}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">
                {tr.title}
              </span>
              <select
                value={tr.albumId ?? ""}
                onChange={(e) =>
                  assign.mutate({
                    trackId: tr.id,
                    albumId: e.target.value || null,
                  })
                }
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] outline-none"
              >
                <option value="">
                  {t("catalog.noAlbum", { defaultValue: "— Sin álbum —" })}
                </option>
                {artist.albums.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.title}
                  </option>
                ))}
              </select>
              <ImageUploadButton
                title={t("catalog.uploadTrackCover", {
                  defaultValue: "Subir portada de la canción",
                })}
                onUpload={(f) => uploadTrackCover(tr.id, f).then(invalidate)}
                className="h-8 w-8"
              />
              <button
                type="button"
                onClick={() => setLyricsTrack({ id: tr.id, title: tr.title })}
                className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {t("catalog.lyrics", { defaultValue: "Letra" })}
              </button>
            </div>
          ))}
        </div>
      </div>

      {lyricsTrack ? (
        <LyricsModal
          trackId={lyricsTrack.id}
          title={lyricsTrack.title}
          onClose={() => setLyricsTrack(null)}
        />
      ) : null}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const artistsQ = useQuery({
    queryKey: ["catalog", "artists"],
    queryFn: listCatalogArtists,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [page, setPage] = useState(0);

  const artists = artistsQ.data ?? [];

  // Union of every genre assigned to an artist — the options shown in the
  // filter (only genres that actually narrow the list).
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const a of artists) for (const g of a.genres ?? []) set.add(g);
    return [...set].sort((x, y) => x.localeCompare(y));
  }, [artists]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artists.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (genreFilter && !(a.genres ?? []).includes(genreFilter)) return false;
      return true;
    });
  }, [artists, search, genreFilter]);

  // Page the (filtered) list so the column never turns into an endless scroll.
  const ARTISTS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTISTS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * ARTISTS_PER_PAGE,
    safePage * ARTISTS_PER_PAGE + ARTISTS_PER_PAGE,
  );

  // Reset to the first page whenever the filters change the result set.
  useEffect(() => {
    setPage(0);
  }, [search, genreFilter]);

  useEffect(() => {
    if (!selected && filtered.length) setSelected(filtered[0].id);
  }, [filtered, selected]);

  const addArtist = useMutation({
    mutationFn: () => createArtist({ name: newArtist }),
    onSuccess: (a: { id: string }) => {
      setNewArtist("");
      void qc.invalidateQueries({ queryKey: ["catalog", "artists"] });
      if (a?.id) setSelected(a.id);
    },
  });
  const removeArtist = useMutation({
    mutationFn: (id: string) => deleteArtist(id),
    onSuccess: () => {
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["catalog", "artists"] });
    },
  });

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t("catalog.title", { defaultValue: "Catálogo" })}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("catalog.subtitle", {
            defaultValue:
              "Define las relaciones: artistas, sus álbumes, canciones y letras.",
          })}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Artists list */}
        <div className="flex min-h-0 flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.searchArtist", {
              defaultValue: "Buscar artista…",
            })}
            className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          />
          {allGenres.length > 0 ? (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="">
                {t("catalog.allGenres", { defaultValue: "Todos los géneros" })}
              </option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : null}
          {search || genreFilter ? (
            <div className="flex items-center justify-between px-1 text-[11px] text-[var(--color-muted)]">
              <span>
                {t("catalog.filteredCount", {
                  defaultValue: "{{n}} de {{total}}",
                  n: filtered.length,
                  total: artists.length,
                })}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setGenreFilter("");
                }}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t("catalog.clearFilters", { defaultValue: "Limpiar" })}
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder={t("catalog.newArtist", {
                defaultValue: "Nuevo artista…",
              })}
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => newArtist && addArtist.mutate()}
              disabled={!newArtist || addArtist.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-2.5 text-[var(--color-primary-contrast)] disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {(artistsQ.isLoading ? [] : pageItems).map((a: CatalogArtist) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                  selected === a.id
                    ? "bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                    : "hover:bg-white/[0.05]"
                }`}
              >
                <span className="h-9 w-9 flex-none overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
                    {a.name}
                  </span>
                  <span className="block text-[11px] text-[var(--color-muted)]">
                    {t("catalog.artistMeta", {
                      defaultValue: "{{albums}} álb · {{tracks}} canc",
                      albums: a.albumCount,
                      tracks: a.trackCount,
                    })}
                  </span>
                  {a.genres && a.genres.length > 0 ? (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {a.genres.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-accent)]"
                        >
                          {g}
                        </span>
                      ))}
                      {a.genres.length > 3 ? (
                        <span className="text-[9px] text-[var(--color-muted)]">
                          +{a.genres.length - 3}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
            {!artistsQ.isLoading && pageItems.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-[var(--color-muted)]">
                {t("catalog.noArtistsMatch", {
                  defaultValue: "Ningún artista coincide.",
                })}
              </p>
            ) : null}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--color-line)] pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("catalog.prev", { defaultValue: "Anterior" })}
              </button>
              <span className="text-[11px] tabular-nums text-[var(--color-muted)]">
                {t("catalog.pageOf", {
                  defaultValue: "{{page}} / {{total}}",
                  page: safePage + 1,
                  total: totalPages,
                })}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("catalog.next", { defaultValue: "Siguiente" })}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Detail */}
        <div className="min-h-0 overflow-y-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-5">
          {selected ? (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        t("catalog.deleteArtistConfirm", {
                          defaultValue:
                            "¿Eliminar este artista? Sus canciones quedan sin artista.",
                        }),
                      )
                    ) {
                      removeArtist.mutate(selected);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:border-rose-400/50 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />{" "}
                  {t("catalog.deleteArtist", {
                    defaultValue: "Eliminar artista",
                  })}
                </button>
              </div>
              <ArtistEditor artistId={selected} />
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              {t("catalog.selectArtist", {
                defaultValue: "Selecciona o crea un artista.",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
