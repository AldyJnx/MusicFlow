import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Crop,
  Disc3,
  ImagePlus,
  Loader2,
  Music4,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import { showActionNotice } from "../../shared/ui/ActionNotice";
import {
  syncCatalogFromR2,
  type CatalogSyncResult,
} from "../../shared/api/admin";

import {
  assignTrack,
  createAlbum,
  createArtist,
  deleteTrackLyrics,
  deleteCatalogTrack,
  deleteAlbum,
  deleteArtist,
  removeArtistImage,
  getCatalogArtist,
  getTrackLyrics,
  listCatalogArtists,
  listCatalogGenres,
  updateArtist,
  updateCatalogTrack,
  replaceCatalogTrackAudio,
  updateTrackLyrics,
  uploadAlbumCover,
  uploadArtistImage,
  uploadArtistImageFromUrl,
  updateAlbum,
  uploadCatalogTrack,
  uploadTrackCover,
  type CatalogAlbumSummary,
  type CatalogArtist,
  type CatalogTrackCard,
} from "../../shared/api/catalog";

/** mm:ss from milliseconds. */
function fmtDur(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

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

// ── Image crop/center modal ──────────────────────────────────────────────────────
// Lets the admin pan + zoom a chosen image inside a square frame and exports the
// visible region as a centered cover — no cropping library, just canvas.
const CROP_VIEW = 320;
const CROP_OUT_WIDTH = 640;
const CROP_OUT_HEIGHT = 637;
const EMPTY_ARTISTS: CatalogArtist[] = [];

function ImageCropModal({
  src,
  fileName = "cover.webp",
  crossOrigin = false,
  round = false,
  onCancel,
  onConfirm,
}: {
  src: string;
  fileName?: string;
  crossOrigin?: boolean;
  round?: boolean;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const { t } = useTranslation();
  const url = src;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  // Scale that makes the image cover the square frame at zoom 1.
  const baseScale = nat ? Math.max(CROP_VIEW / nat.w, CROP_VIEW / nat.h) : 1;
  const drawScale = baseScale * zoom;
  const dw = nat ? nat.w * drawScale : 0;
  const dh = nat ? nat.h * drawScale : 0;

  const clamp = useCallback(
    (o: { x: number; y: number }) => ({
      x: Math.min(0, Math.max(CROP_VIEW - dw, o.x)),
      y: Math.min(0, Math.max(CROP_VIEW - dh, o.y)),
    }),
    [dw, dh],
  );

  // Re-center on load and whenever zoom changes the bounds.
  useEffect(() => {
    if (!nat) return;
    setOffset((o) => clamp({ x: o.x, y: o.y }));
  }, [nat, zoom, clamp]);

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const im = e.currentTarget;
    setNat({ w: im.naturalWidth, h: im.naturalHeight });
    setOffset({
      x:
        (CROP_VIEW -
          im.naturalWidth *
            Math.max(
              CROP_VIEW / im.naturalWidth,
              CROP_VIEW / im.naturalHeight,
            )) /
        2,
      y:
        (CROP_VIEW -
          im.naturalHeight *
            Math.max(
              CROP_VIEW / im.naturalWidth,
              CROP_VIEW / im.naturalHeight,
            )) /
        2,
    });
  }

  async function exportCrop() {
    if (!nat) return;
    setExporting(true);
    setError(null);
    try {
      // Draw from a freshly-decoded image (not the DOM node) so the canvas is
      // never blank because the element wasn't ready.
      const im = new Image();
      if (crossOrigin) im.crossOrigin = "anonymous";
      im.src = url;
      await im.decode();

      const canvas = document.createElement("canvas");
      canvas.width = CROP_OUT_WIDTH;
      canvas.height = CROP_OUT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas");
      const scaleX = CROP_OUT_WIDTH / CROP_VIEW;
      const scaleY = CROP_OUT_HEIGHT / CROP_VIEW;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CROP_OUT_WIDTH, CROP_OUT_HEIGHT);
      ctx.drawImage(
        im,
        offset.x * scaleX,
        offset.y * scaleY,
        dw * scaleX,
        dh * scaleY,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.92),
      );
      if (!blob) throw new Error("export-failed");
      const safe = `${fileName.replace(/\.[^.]+$/, "") || "cover"}.webp`;
      onConfirm(new File([blob], safe, { type: blob.type }));
    } catch {
      setError(
        t("catalog.cropError", {
          defaultValue: "No se pudo procesar la imagen. Intenta con otra.",
        }),
      );
      setExporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            {t("catalog.centerImage", { defaultValue: "Centrar imagen" })}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="relative mx-auto select-none overflow-hidden bg-black"
          style={{
            width: CROP_VIEW,
            height: CROP_VIEW,
            borderRadius: round ? "9999px" : "16px",
            cursor: drag.current ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setOffset(
              clamp({
                x: drag.current.ox + (e.clientX - drag.current.x),
                y: drag.current.oy + (e.clientY - drag.current.y),
              }),
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <img
            ref={imgRef}
            src={url}
            alt=""
            crossOrigin={crossOrigin ? "anonymous" : undefined}
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              left: offset.x,
              top: offset.y,
              width: dw,
              height: dh,
              maxWidth: "none",
            }}
          />
          {/* subtle framing grid */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
        </div>

        <div className="flex items-center gap-3">
          <ImagePlus className="h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--color-primary)]"
          />
        </div>
        <p className="text-center text-[11px] text-[var(--color-muted)]">
          {t("catalog.cropHint", {
            defaultValue: "Arrastra para mover · desliza para acercar",
          })}
        </p>
        {error ? (
          <p className="text-center text-xs text-rose-400">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {t("catalog.cancel", { defaultValue: "Cancelar" })}
          </button>
          <button
            type="button"
            onClick={exportCrop}
            disabled={!nat || exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("catalog.useImage", { defaultValue: "Usar imagen" })}
          </button>
        </div>
      </div>
    </div>
  );
}

// A compact image picker that lets the admin center the image, then uploads it.
// When `currentSrc` is set it also offers a "reframe" action on the existing
// image (re-center the one already saved, no re-pick needed).
function ImageUploadButton({
  onUpload,
  title,
  round = false,
  className = "",
  currentSrc,
  onUploadUrl,
  artistPhotoPicker = false,
  allowReframe = true,
}: {
  onUpload: (file: File) => Promise<unknown>;
  title: string;
  round?: boolean;
  className?: string;
  currentSrc?: string | null;
  onUploadUrl?: (url: string) => Promise<unknown>;
  artistPhotoPicker?: boolean;
  allowReframe?: boolean;
}) {
  const { t } = useTranslation();
  const m = useMutation({ mutationFn: onUpload });
  const [photoSource, setPhotoSource] = useState<"choices" | "url" | null>(
    null,
  );
  const [url, setUrl] = useState("");
  const uploadUrl = useMutation({
    mutationFn: (value: string) => {
      if (!onUploadUrl) throw new Error("URL upload is unavailable");
      return onUploadUrl(value);
    },
    onSuccess: () => setPhotoSource(null),
    onError: () => showActionNotice("No se pudo subir la foto", "error"),
  });
  // crop source: a remote URL (reframe) or an object URL we own (new file).
  const [crop, setCrop] = useState<{
    src: string;
    fileName: string;
    crossOrigin: boolean;
    owned: boolean;
  } | null>(null);

  function close() {
    setCrop((c) => {
      if (c?.owned) URL.revokeObjectURL(c.src);
      return null;
    });
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    setPhotoSource(null);
    setCrop({
      src: URL.createObjectURL(file),
      fileName: file.name,
      crossOrigin: false,
      owned: true,
    });
  }

  if (artistPhotoPicker) {
    return (
      <>
        <button
          type="button"
          title="Cambiar foto del artista"
          aria-label="Cambiar foto del artista"
          onClick={() => setPhotoSource("choices")}
          className={`inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${className}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        {photoSource ? (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setPhotoSource(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_30px_80px_rgba(0,0,0,.5)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Cambiar foto del artista
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Solo AVIF o WEBP de exactamente 640 × 637 px.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoSource(null)}
                  aria-label="Cerrar"
                  className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {photoSource === "choices" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPhotoSource("url")}
                    className="rounded-xl border border-[var(--color-line)] p-4 text-left transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                  >
                    <p className="font-semibold text-[var(--color-text)]">
                      URL de Cloudflare R2
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Adjunta la URL pública de una imagen AVIF o WEBP.
                    </p>
                  </button>
                  <label className="cursor-pointer rounded-xl border border-[var(--color-line)] p-4 transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5">
                    <p className="font-semibold text-[var(--color-text)]">
                      Subir imagen
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Selecciona un archivo AVIF o WEBP de 640 × 637 px.
                    </p>
                    <input
                      type="file"
                      accept="image/avif,image/webp,.avif,.webp"
                      className="hidden"
                      onChange={(event) => {
                        chooseFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (url.trim()) uploadUrl.mutate(url.trim());
                  }}
                  className="flex flex-col gap-3"
                >
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted)]">
                    URL pública de Cloudflare R2
                    <input
                      autoFocus
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://…r2.dev/artista.avif"
                      className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm font-normal text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoSource("choices")}
                      className="rounded-lg px-3 py-2 text-sm text-[var(--color-muted)]"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={uploadUrl.isPending || !url.trim()}
                      className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
                    >
                      {uploadUrl.isPending ? "Subiendo…" : "Usar URL"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
        {crop ? (
          <ImageCropModal
            src={crop.src}
            fileName={crop.fileName}
            crossOrigin={crop.crossOrigin}
            round={round}
            onCancel={close}
            onConfirm={(cropped) => {
              close();
              m.mutate(cropped);
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="inline-flex items-center gap-1">
        {currentSrc && allowReframe ? (
          <button
            type="button"
            title={t("catalog.reframe", { defaultValue: "Recentrar" })}
            onClick={() =>
              setCrop({
                src: currentSrc,
                fileName: "cover.jpg",
                crossOrigin: true,
                owned: false,
              })
            }
            className={`inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-glass)] text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${className}`}
          >
            <Crop className="h-4 w-4" />
          </button>
        ) : null}
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
            accept="image/avif,image/webp,.avif,.webp"
            className="hidden"
            disabled={m.isPending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f)
                setCrop({
                  src: URL.createObjectURL(f),
                  fileName: f.name,
                  crossOrigin: false,
                  owned: true,
                });
              e.target.value = "";
            }}
          />
        </label>
        {onUploadUrl ? (
          <button
            type="button"
            title="Usar URL de Cloudflare R2"
            onClick={() => {
              const url = window.prompt(
                "URL pública AVIF/WEBP de Cloudflare R2:",
              );
              if (url) void onUploadUrl(url);
            }}
            className={`inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-glass)] text-[var(--color-muted)] transition hover:text-[var(--color-text)] ${className}`}
          >
            URL
          </button>
        ) : null}
      </div>
      {crop ? (
        <ImageCropModal
          src={crop.src}
          fileName={crop.fileName}
          crossOrigin={crop.crossOrigin}
          round={round}
          onCancel={close}
          onConfirm={(cropped) => {
            close();
            m.mutate(cropped);
          }}
        />
      ) : null}
    </>
  );
}

// ── Album editor modal ──────────────────────────────────────────────────────────
function AlbumModal({
  album,
  artistAlbums,
  artistTracks,
  onClose,
  onChange,
}: {
  album: CatalogAlbumSummary;
  artistAlbums: CatalogAlbumSummary[];
  artistTracks: CatalogTrackCard[];
  onClose: () => void;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(album.title);
  const [year, setYear] = useState(album.year ? String(album.year) : "");
  const currentYear = new Date().getFullYear();
  const hasChanges =
    title.trim() !== album.title || (year ? Number(year) : null) !== album.year;

  const inAlbum = artistTracks
    .filter((tr) => tr.albumId === album.id)
    .sort((a, b) => (a.albumOrder ?? 0) - (b.albumOrder ?? 0));
  const available = artistTracks.filter((tr) => tr.albumId !== album.id);
  // `albumId` is the authoritative relation. The denormalized `album` label
  // may be stale on imported rows, so never use it to claim a song is orphaned.
  const albumTitleById = new Map(
    artistAlbums.map((artistAlbum) => [artistAlbum.id, artistAlbum.title]),
  );

  const save = useMutation({
    mutationFn: () =>
      updateAlbum(album.id, {
        title: title.trim() || album.title,
        year: year ? Number(year) : undefined,
      }),
    onSuccess: () => {
      onChange();
      showActionNotice("Cambios aplicados con éxito");
    },
    onError: () => showActionNotice("Hubo un problema", "error"),
  });
  const add = useMutation({
    mutationFn: (trackId: string) =>
      assignTrack(trackId, {
        albumId: album.id,
        albumOrder: inAlbum.length + 1,
      }),
    onSuccess: onChange,
  });
  const remove = useMutation({
    mutationFn: (trackId: string) => assignTrack(trackId, { albumId: null }),
    onSuccess: onChange,
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Disc3 className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="text-sm font-bold text-[var(--color-text)]">
              {t("catalog.editAlbum", { defaultValue: "Editar álbum" })}
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
          {/* Header: cover + fields */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative h-32 w-32 flex-none">
              <div className="h-full w-full overflow-hidden rounded-xl bg-[var(--color-surface-alt)]">
                {album.coverArt ? (
                  <img
                    src={album.coverArt}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Disc3 className="absolute inset-0 m-auto h-10 w-10 text-[var(--color-muted)]" />
                )}
              </div>
              <ImageUploadButton
                title={t("catalog.uploadAlbumCover", {
                  defaultValue: "Subir portada del álbum",
                })}
                currentSrc={album.coverArt}
                onUpload={(f) => uploadAlbumCover(album.id, f).then(onChange)}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[var(--color-surface)]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {t("catalog.albumTitle", {
                    defaultValue: "Título del álbum",
                  })}
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
              </label>
              <div className="flex items-end gap-3">
                <label className="flex w-28 flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    {t("catalog.year", { defaultValue: "Año" })}
                  </span>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="1"
                    max={currentYear}
                    className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => save.mutate()}
                  disabled={save.isPending || !hasChanges}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-alt)] disabled:text-[var(--color-muted)] disabled:opacity-100"
                >
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t("catalog.saveAlbum", { defaultValue: "Guardar" })}
                </button>
              </div>
            </div>
          </div>

          {/* Tracklist */}
          <h4 className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {t("catalog.albumTracks", {
              defaultValue: "Canciones del álbum ({{count}})",
              count: inAlbum.length,
            })}
          </h4>
          <div className="flex flex-col divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)]">
            {inAlbum.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-[var(--color-muted)]">
                {t("catalog.albumEmpty", {
                  defaultValue: "Aún sin canciones. Agrégalas abajo.",
                })}
              </p>
            ) : (
              inAlbum.map((tr, i) => (
                <div
                  key={tr.id}
                  className="flex items-center gap-3 bg-[var(--color-glass)] px-3 py-2"
                >
                  <span className="w-5 text-right text-xs tabular-nums text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text)]">
                    {tr.title}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--color-muted)]">
                    {fmtDur(tr.durationMs)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(tr.id)}
                    disabled={remove.isPending}
                    title={t("catalog.removeFromAlbum", {
                      defaultValue: "Quitar del álbum",
                    })}
                    className="text-[var(--color-muted)] transition hover:text-rose-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add songs */}
          {available.length > 0 ? (
            <>
              <h4 className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                {t("catalog.addFromArtist", {
                  defaultValue: "Agregar canciones del artista",
                })}
              </h4>
              <div className="flex max-h-48 flex-col divide-y divide-[var(--color-line)] overflow-y-auto rounded-xl border border-[var(--color-line)]">
                {available.map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center gap-3 bg-[var(--color-glass)] px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text)]">
                      {tr.title}
                    </span>
                    {tr.albumId ? (
                      <span className="truncate text-[10px] text-[var(--color-muted)]">
                        {albumTitleById.get(tr.albumId) || tr.album}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => add.mutate(tr.id)}
                      disabled={add.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("catalog.add", { defaultValue: "Agregar" })}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TrackEditorModal({
  track,
  onSaved,
  onClose,
}: {
  track: CatalogTrackCard;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(track.title);
  const [audioUrl, setAudioUrl] = useState(track.fileUrlRemote ?? "");
  const [file, setFile] = useState<File | null>(null);
  const saveDetails = useMutation({
    mutationFn: () => {
      const normalizedAudioUrl = audioUrl.trim();
      return updateCatalogTrack(track.id, {
        title: title.trim(),
        ...(normalizedAudioUrl ? { fileUrlRemote: normalizedAudioUrl } : {}),
      });
    },
    onSuccess: () => {
      onSaved();
      showActionNotice("Datos de la canción actualizados");
    },
    onError: () =>
      showActionNotice("No se pudo actualizar la canción", "error"),
  });
  const replaceAudio = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Selecciona un WAV o FLAC.");
      return replaceCatalogTrackAudio(track.id, file);
    },
    onSuccess: () => {
      setFile(null);
      onSaved();
      showActionNotice("Audio reemplazado y metadatos actualizados");
    },
    onError: () => showActionNotice("No se pudo reemplazar el audio", "error"),
  });

  return (
    <div
      className="fixed inset-0 z-[81] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Editar canción
            </p>
            <h3 className="mt-1 text-base font-bold text-[var(--color-text)]">
              {track.title}
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
        <div className="space-y-4 p-5">
          <Field
            label="Título"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Field
            label="URL pública de Cloudflare R2 (WAV o FLAC)"
            type="url"
            value={audioUrl}
            onChange={(event) => setAudioUrl(event.target.value)}
          />
          <p className="text-xs text-[var(--color-muted)]">
            La URL solo se vincula: no se duplica ningún objeto existente de R2.
          </p>
          <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Reemplazar audio
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              WAV o FLAC, hasta 100 MB. Se actualizan duración, códec y URL.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)]">
                {file?.name ?? "Seleccionar WAV o FLAC"}
                <input
                  type="file"
                  accept=".wav,.flac,audio/wav,audio/x-wav,audio/flac,audio/x-flac"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={() => replaceAudio.mutate()}
                disabled={!file || replaceAudio.isPending}
                className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
              >
                {replaceAudio.isPending ? "Reemplazando…" : "Reemplazar"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-line)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => saveDetails.mutate()}
            disabled={!title.trim() || saveDetails.isPending}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
          >
            {saveDetails.isPending ? "Guardando…" : "Guardar datos"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lyrics editor modal ────────────────────────────────────────────────────────
function LyricsModal({
  trackId,
  title,
  onSaved,
  onClose,
}: {
  trackId: string;
  title: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [trackTitle, setTrackTitle] = useState(title);
  const [lrc, setLrc] = useState("");
  const [cloudflareUrl, setCloudflareUrl] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const lyricsQ = useQuery({
    queryKey: ["admin", "lyrics", trackId],
    queryFn: () => getTrackLyrics(trackId),
  });
  useEffect(() => {
    if (lyricsQ.data && !loaded) {
      setLrc(lyricsQ.data.lrc ?? lyricsQ.data.text ?? "");
      setCloudflareUrl(lyricsQ.data.lyricsUrl ?? "");
      setLoaded(true);
    }
  }, [lyricsQ.data, loaded]);

  const hasStoredLyrics = Boolean(lyricsQ.data?.hasLyrics);

  const save = useMutation({
    mutationFn: (source: "editor" | "cloudflare") => {
      if (source === "cloudflare") {
        return updateTrackLyrics(trackId, { lyricsUrl: cloudflareUrl.trim() });
      }
      const isLrc = /\[\d{1,2}:\d{2}/.test(lrc);
      return updateTrackLyrics(
        trackId,
        isLrc ? { lyricsLrc: lrc } : { lyricsText: lrc },
      );
    },
    onSuccess: () => {
      onSaved();
      showActionNotice("Letra actualizada con éxito");
      onClose();
    },
    onError: () =>
      showActionNotice(
        "No se pudo guardar la letra. Verifica el enlace o el archivo.",
        "error",
      ),
  });
  const saveTrackDetails = useMutation({
    mutationFn: () => updateCatalogTrack(trackId, { title: trackTitle.trim() }),
    onSuccess: () => {
      onSaved();
      showActionNotice("Canción actualizada con éxito");
    },
    onError: () =>
      showActionNotice("No se pudo actualizar la canción", "error"),
  });
  const removeLyrics = useMutation({
    mutationFn: () => deleteTrackLyrics(trackId),
    onSuccess: () => {
      onSaved();
      showActionNotice("Letra eliminada de MusicFlow y Cloudflare R2");
      onClose();
    },
    onError: () =>
      showActionNotice(
        "No se pudo eliminar la letra de Cloudflare R2",
        "error",
      ),
  });

  async function loadLrcFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".lrc")) {
      showActionNotice("Selecciona un archivo .lrc", "error");
      return;
    }
    const text = await file.text();
    if (text.length > 50_000) {
      showActionNotice("El archivo LRC excede el límite de 50 KB", "error");
      return;
    }
    setLrc(text);
    setLoaded(true);
  }

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
              Editar canción y letra
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label
              title={t("catalog.uploadLrcTitle", {
                defaultValue: "Subir archivo .lrc",
              })}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {t("catalog.uploadLrc", { defaultValue: "Subir .lrc" })}
              <input
                type="file"
                accept=".lrc,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  await loadLrcFile(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex gap-2">
            <input
              value={trackTitle}
              onChange={(event) => setTrackTitle(event.target.value)}
              aria-label="Título de la canción"
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => saveTrackDetails.mutate()}
              disabled={
                saveTrackDetails.isPending ||
                !trackTitle.trim() ||
                trackTitle.trim() === title
              }
              className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
            >
              Guardar canción
            </button>
          </div>
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            {t("catalog.lyricsHintBefore", {
              defaultValue:
                "Sube un .lrc o pega la letra. Si usa marcas de tiempo",
            })}{" "}
            <code>[mm:ss.xx]</code>{" "}
            {t("catalog.lyricsHintAfter", {
              defaultValue:
                "se sincroniza con la reproducción; si no, se guarda como texto plano.",
            })}
          </p>
          <div className="mb-4 rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--color-text)]">
                Enlace público de Cloudflare R2 (.lrc)
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">
                Se vincula al objeto existente de R2; no se vuelve a subir ni se
                duplica.
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={cloudflareUrl}
                  onChange={(event) => setCloudflareUrl(event.target.value)}
                  placeholder="https://...r2.dev/mi-cancion.lrc"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => save.mutate("cloudflare")}
                  disabled={!cloudflareUrl.trim() || save.isPending}
                  className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
                >
                  {hasStoredLyrics ? "Actualizar enlace" : "Vincular"}
                </button>
              </div>
            </label>
          </div>
          {lyricsQ.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
            </div>
          ) : (
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingFile(false);
                void loadLrcFile(event.dataTransfer.files[0]);
              }}
              className={`block rounded-lg border border-dashed p-1 transition ${
                isDraggingFile
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-line)]"
              }`}
            >
              <textarea
                value={lrc}
                onChange={(e) => setLrc(e.target.value)}
                rows={14}
                placeholder="Arrastra un archivo .lrc aquí o pega la letra con [00:12.50] ..."
                className="w-full resize-y bg-transparent p-3 font-mono text-sm text-[var(--color-text)] outline-none"
              />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-line)] px-5 py-4">
          {hasStoredLyrics ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Eliminar esta letra de MusicFlow y de Cloudflare R2?",
                  )
                ) {
                  removeLyrics.mutate();
                }
              }}
              disabled={removeLyrics.isPending || save.isPending}
              className="rounded-xl border border-rose-400/50 px-4 py-2 text-sm font-semibold text-rose-300 hover:border-rose-400 hover:bg-rose-400/10 disabled:opacity-50"
            >
              {removeLyrics.isPending ? "Eliminando…" : "Eliminar letra"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            {t("catalog.cancel", { defaultValue: "Cancelar" })}
          </button>
          <button
            type="button"
            onClick={() => save.mutate("editor")}
            disabled={!lrc.trim() || save.isPending}
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

function FeaturedArtistsModal({
  track,
  onClose,
  onSave,
  isSaving,
}: {
  track: CatalogTrackCard;
  onClose: () => void;
  onSave: (
    credits: Array<{ artistName: string; artistId?: string | null }>,
  ) => void;
  isSaving: boolean;
}) {
  const [query, setQuery] = useState("");
  const [unregisteredName, setUnregisteredName] = useState("");
  const [credits, setCredits] = useState(() =>
    track.featuredArtists.map((credit) => ({
      artistName: credit.artistName,
      artistId: credit.artistId,
    })),
  );
  const artistsQ = useQuery({
    queryKey: ["catalog", "artists"],
    queryFn: listCatalogArtists,
    staleTime: 60_000,
  });
  const availableArtists = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (artistsQ.data ?? EMPTY_ARTISTS)
      .filter((artist) =>
        normalizedQuery
          ? artist.name.toLocaleLowerCase().includes(normalizedQuery)
          : true,
      )
      .slice(0, 24);
  }, [artistsQ.data, query]);
  const selectedIds = useMemo(
    () =>
      new Set(
        credits.flatMap((credit) => (credit.artistId ? [credit.artistId] : [])),
      ),
    [credits],
  );

  function removeCredit(credit: {
    artistName: string;
    artistId?: string | null;
  }) {
    setCredits((current) =>
      current.filter(
        (candidate) =>
          candidate.artistId !== credit.artistId ||
          candidate.artistName !== credit.artistName,
      ),
    );
  }

  function toggleRegisteredArtist(artist: CatalogArtist) {
    setCredits((current) => {
      if (current.some((credit) => credit.artistId === artist.id)) {
        return current.filter((credit) => credit.artistId !== artist.id);
      }
      return [...current, { artistName: artist.name, artistId: artist.id }];
    });
  }

  function addUnregisteredArtist() {
    const artistName = unregisteredName.trim();
    if (!artistName) return;
    const registeredArtist = (artistsQ.data ?? EMPTY_ARTISTS).find(
      (artist) =>
        artist.name.localeCompare(artistName, undefined, {
          sensitivity: "accent",
        }) === 0,
    );
    if (registeredArtist) {
      toggleRegisteredArtist(registeredArtist);
      setUnregisteredName("");
      return;
    }
    setCredits((current) => {
      const alreadyAdded = current.some(
        (credit) =>
          credit.artistName.localeCompare(artistName, undefined, {
            sensitivity: "accent",
          }) === 0,
      );
      return alreadyAdded
        ? current
        : [...current, { artistName, artistId: null }];
    });
    setUnregisteredName("");
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
          Featuring
        </p>
        <h3 className="mt-1 text-base font-bold text-[var(--color-text)]">
          {track.title}
        </h3>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Elige uno o más artistas del catálogo. Los artistas no registrados se
          conservan como crédito, pero no tendrán perfil público.
        </p>
        {credits.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {credits.map((credit) => (
              <button
                key={`${credit.artistId ?? "unregistered"}:${credit.artistName}`}
                type="button"
                onClick={() => removeCredit(credit)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-text)] hover:border-rose-400 hover:text-rose-400"
                title="Quitar artista invitado"
              >
                {credit.artistName}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar artista registrado…"
          className="mt-4 w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
        />
        <div className="mt-3 grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {artistsQ.isLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
            </div>
          ) : availableArtists.length > 0 ? (
            availableArtists.map((artist) => {
              const selected = selectedIds.has(artist.id);
              return (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => toggleRegisteredArtist(artist)}
                  aria-pressed={selected}
                  className={`flex min-w-0 items-center gap-3 rounded-xl border p-2 text-left transition ${
                    selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-line)] bg-white/[0.03] hover:border-[var(--color-primary)]/55"
                  }`}
                >
                  <span className="h-9 w-9 flex-none overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">
                    {artist.name}
                  </span>
                  {selected ? (
                    <span className="text-xs font-bold text-[var(--color-primary)]">
                      Añadido
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className="col-span-full px-1 py-4 text-center text-xs text-[var(--color-muted)]">
              No se encontraron artistas registrados.
            </p>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-[var(--color-line)] bg-white/[0.02] p-3">
          <p className="text-xs font-bold text-[var(--color-text)]">
            Artista N-Regist
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            Artista no registrado: se mostrará en el crédito “ft.”, sin enlace a
            un perfil.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={unregisteredName}
              onChange={(event) => setUnregisteredName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addUnregisteredArtist();
                }
              }}
              placeholder="Nombre del artista"
              className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={addUnregisteredArtist}
              disabled={!unregisteredName.trim()}
              className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-50"
            >
              Añadir
            </button>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(credits)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar featuring
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAlbumModal({
  artistId,
  onClose,
  onCreated,
}: {
  artistId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () => {
      if (!cover) throw new Error("Selecciona la portada del álbum.");
      const album = (await createAlbum({
        title: title.trim(),
        artistId,
        year: year ? Number(year) : undefined,
      })) as { id: string };
      await uploadAlbumCover(album.id, cover);
    },
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (reason: unknown) =>
      setError(
        reason instanceof Error ? reason.message : "No se pudo crear el álbum.",
      ),
  });

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Crear álbum</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Título, año y portada AVIF o WEBP de 640 × 637 px.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <Field
            label="Título del álbum"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
          <Field
            label="Año"
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[var(--color-line)] bg-white/[0.03] px-4 py-3 text-sm transition hover:border-[var(--color-primary)]">
            <span className="min-w-0">
              <span className="block font-semibold text-[var(--color-text)]">
                Portada del álbum
              </span>
              <span className="block truncate text-xs text-[var(--color-muted)]">
                {cover?.name ?? "AVIF o WEBP, 640 × 637 px"}
              </span>
            </span>
            <ImagePlus className="ml-3 h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <input
              type="file"
              accept="image/avif,image/webp,.avif,.webp"
              className="hidden"
              onChange={(event) => setCover(event.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--color-line)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={!title.trim() || !cover || create.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Crear álbum
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
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [lyricsTrack, setLyricsTrack] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editingTrack, setEditingTrack] = useState<CatalogTrackCard | null>(
    null,
  );
  const [featuredTrack, setFeaturedTrack] = useState<CatalogTrackCard | null>(
    null,
  );
  const [editAlbumId, setEditAlbumId] = useState<string | null>(null);
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [trackPage, setTrackPage] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const genreSuggestionsQ = useQuery({
    queryKey: ["catalog", "genres"],
    queryFn: listCatalogGenres,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (artist) {
      setName(artist.name);
      setBio(artist.bio ?? "");
      setGenres(artist.genres ?? []);
    }
  }, [artist]);

  function addGenre(raw: string) {
    const v = raw.trim();
    if (!v) return;
    setGenres((previous) =>
      previous.some((genre) => genre.toLowerCase() === v.toLowerCase())
        ? previous
        : [...previous, v].slice(0, 12),
    );
    setGenreInput("");
  }

  const uploadSong = useMutation({
    mutationFn: (file: File) => {
      const artistName = artist?.name;
      if (!artistName) {
        throw new Error("El artista aún no está disponible.");
      }
      const fileTitle = file.name.replace(/\.[^.]+$/, "").trim();
      const artistPrefix = `${artistName} - `.toLocaleLowerCase();
      const title =
        uploadTitle.trim() ||
        (fileTitle.toLocaleLowerCase().startsWith(artistPrefix)
          ? fileTitle.slice(artistName.length + 3).trim()
          : fileTitle);
      return uploadCatalogTrack(file, {
        artistId,
        albumId: uploadAlbumId || undefined,
        title,
      });
    },
    onSuccess: () => {
      setUploadError(null);
      setUploadTitle("");
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
        bio: bio || undefined,
        genres,
      }),
    onSuccess: () => {
      invalidate();
      showActionNotice("Cambios aplicados con éxito");
    },
    onError: () => showActionNotice("Hubo un problema", "error"),
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
  const saveFeaturedArtists = useMutation({
    mutationFn: (
      featuredArtists: Array<{
        artistName: string;
        artistId?: string | null;
      }>,
    ) => {
      if (!featuredTrack) return Promise.resolve();
      return assignTrack(featuredTrack.id, {
        featuredArtists,
      });
    },
    onSuccess: () => {
      setFeaturedTrack(null);
      invalidate();
      showActionNotice("Featuring actualizado");
    },
    onError: () =>
      showActionNotice("No se pudo actualizar el featuring", "error"),
  });
  const removeTrack = useMutation({
    mutationFn: (id: string) => deleteCatalogTrack(id),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({
        queryKey: ["admin", "dashboard", "music-insights"],
      });
    },
  });

  if (artistQ.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  if (artistQ.isError || !artist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold text-rose-400">
          No se pudo cargar este artista.
        </p>
        <button
          type="button"
          onClick={() => void artistQ.refetch()}
          className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const artistHasChanges =
    name !== artist.name ||
    bio !== (artist.bio ?? "") ||
    JSON.stringify([...genres].sort()) !==
      JSON.stringify([...(artist.genres ?? [])].sort());
  const filteredTracks = artist.tracks.filter((track) =>
    uploadAlbumId ? track.albumId === uploadAlbumId : track.albumId === null,
  );
  const trackPageCount = Math.max(1, Math.ceil(filteredTracks.length / 5));
  const visibleTracks = filteredTracks.slice(trackPage * 5, trackPage * 5 + 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Artist header / edit */}
      <div className="flex gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-4">
        <div className="relative h-24 w-24 flex-none">
          <div className="h-full w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <ImageUploadButton
            key={`artist-image-${artistId}`}
            title={t("catalog.uploadArtistImage", {
              defaultValue: "Subir foto del artista",
            })}
            round
            currentSrc={artist.imageUrl}
            onUpload={(f) => uploadArtistImage(artistId, f).then(invalidate)}
            onUploadUrl={(url) =>
              uploadArtistImageFromUrl(artistId, url).then(invalidate)
            }
            artistPhotoPicker
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[var(--color-surface)]"
          />
          {artist.imageUrl ? (
            <button
              type="button"
              title="Quitar foto de perfil"
              aria-label="Quitar foto de perfil"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Quitar la foto del perfil? El archivo de R2 no se eliminará.",
                  )
                ) {
                  void removeArtistImage(artistId)
                    .then(invalidate)
                    .catch(() =>
                      showActionNotice("No se pudo quitar la foto", "error"),
                    );
                }
              }}
              className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          <Field
            label={t("catalog.name", { defaultValue: "Nombre" })}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="self-end pb-2 text-xs text-[var(--color-muted)]">
            Foto: AVIF o WEBP, exactamente 640×637 px.
          </p>
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
            <select
              value={genres[0] ?? ""}
              onChange={(event) =>
                setGenres(event.target.value ? [event.target.value] : [])
              }
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              aria-label="Seleccionar género existente"
              hidden
            >
              <option value="">Seleccionar género existente…</option>
              {genres[0] ? (
                <option value={genres[0]}>{genres[0]}</option>
              ) : null}
              {(genreSuggestionsQ.data ?? [])
                .filter(
                  (genre) =>
                    !genres.some(
                      (selectedGenre) =>
                        selectedGenre.toLowerCase() === genre.toLowerCase(),
                    ),
                )
                .map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
            </select>
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
              disabled={saveArtist.isPending || !artistHasChanges}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] transition disabled:cursor-not-allowed disabled:bg-[var(--color-surface-alt)] disabled:text-[var(--color-muted)] disabled:opacity-100"
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
        <div className="mb-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <button
            type="button"
            onClick={() => setCreatingAlbum(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-primary)] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />{" "}
            {t("catalog.createAlbum", { defaultValue: "Crear álbum" })}
          </button>
        </div>
        {artist.albums.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            {t("catalog.noAlbums", {
              defaultValue:
                "Aún no hay álbumes. Crea uno y asigna canciones abajo.",
            })}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {artist.albums.map((al) => (
              <div
                key={al.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-alt)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)]"
              >
                {/* Cover (click to edit) */}
                <button
                  type="button"
                  onClick={() => setEditAlbumId(al.id)}
                  className="relative block aspect-square w-full overflow-hidden bg-[var(--color-glass)]"
                  title={t("catalog.editAlbum", {
                    defaultValue: "Editar álbum",
                  })}
                >
                  {al.coverArt ? (
                    <img
                      src={al.coverArt}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Disc3 className="absolute inset-0 m-auto h-10 w-10 text-[var(--color-muted)]" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary-contrast)]">
                      <Pencil className="h-3.5 w-3.5" />
                      {t("catalog.edit", { defaultValue: "Editar" })}
                    </span>
                  </span>
                </button>

                {/* Quick cover-upload + delete, top-right */}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <ImageUploadButton
                    title={t("catalog.uploadAlbumCover", {
                      defaultValue: "Subir portada del álbum",
                    })}
                    currentSrc={al.coverArt}
                    allowReframe={false}
                    onUpload={(f) =>
                      uploadAlbumCover(al.id, f).then(invalidate)
                    }
                    className="h-7 w-7 rounded-full bg-[var(--color-surface)]/90"
                  />
                  <button
                    type="button"
                    onClick={() => removeAlbum.mutate(al.id)}
                    title={t("catalog.deleteAlbum", {
                      defaultValue: "Eliminar álbum",
                    })}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)]/90 text-[var(--color-muted)] hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Meta */}
                <div className="p-2.5">
                  <p
                    className="truncate text-sm font-bold text-[var(--color-text)]"
                    title={al.title}
                  >
                    {al.title}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {al.year ? `${al.year} · ` : ""}
                    {t("catalog.trackCountShort", {
                      defaultValue: "{{count}} canc.",
                      count: al.trackCount,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tracks */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Music4 className="h-4 w-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
            {t("catalog.tracks", {
              defaultValue: "Canciones ({{count}})",
              count: filteredTracks.length,
            })}
          </h3>
        </div>

        {/* Upload a new catalog song for this artist (optionally into an album). */}
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <input
            value={uploadTitle}
            onChange={(event) => setUploadTitle(event.target.value)}
            placeholder="Nombre de la canción (opcional)"
            className="min-w-48 flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] outline-none"
          />
          <select
            value={uploadAlbumId}
            onChange={(e) => {
              setUploadAlbumId(e.target.value);
              setTrackPage(0);
            }}
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
              accept=".wav,.flac,audio/wav,audio/x-wav,audio/flac,audio/x-flac"
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
                "Solo WAV o FLAC (hasta 100 MB). Se guarda en R2 como «artista - canción» y se asigna a este artista.",
            })}
          </span>
          {uploadError ? (
            <span className="w-full text-xs text-rose-400">{uploadError}</span>
          ) : null}
        </div>

        <div className="flex flex-col divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)]">
          {visibleTracks.map((tr) => (
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
              {!tr.albumId ? (
                <ImageUploadButton
                  title={t("catalog.uploadTrackCover", {
                    defaultValue: "Subir portada de la canción",
                  })}
                  currentSrc={tr.coverArt}
                  onUpload={(f) => uploadTrackCover(tr.id, f).then(invalidate)}
                  className="h-8 w-8"
                />
              ) : null}
              <button
                type="button"
                onClick={() => setFeaturedTrack(tr)}
                title="Editar artistas invitados"
                className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Featuring
              </button>
              <button
                type="button"
                onClick={() => setEditingTrack(tr)}
                title="Editar datos y audio de la canción"
                aria-label={`Editar ${tr.title}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLyricsTrack({ id: tr.id, title: tr.title })}
                className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {t("catalog.lyrics", { defaultValue: "Letra" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar "${tr.title}" del catálogo?`)) {
                    removeTrack.mutate(tr.id);
                  }
                }}
                disabled={removeTrack.isPending}
                title="Eliminar canción del catálogo"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-muted)] hover:border-rose-400 hover:text-rose-400 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {trackPageCount > 1 ? (
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-[var(--color-muted)]">
            <button
              type="button"
              onClick={() => setTrackPage((page) => Math.max(0, page - 1))}
              disabled={trackPage === 0}
              className="rounded-lg border border-[var(--color-line)] px-3 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              {trackPage + 1} / {trackPageCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setTrackPage((page) => Math.min(trackPageCount - 1, page + 1))
              }
              disabled={trackPage >= trackPageCount - 1}
              className="rounded-lg border border-[var(--color-line)] px-3 py-1 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        ) : null}
      </div>

      {lyricsTrack ? (
        <LyricsModal
          trackId={lyricsTrack.id}
          title={lyricsTrack.title}
          onSaved={invalidate}
          onClose={() => setLyricsTrack(null)}
        />
      ) : null}
      {editingTrack ? (
        <TrackEditorModal
          track={editingTrack}
          onSaved={invalidate}
          onClose={() => setEditingTrack(null)}
        />
      ) : null}

      {featuredTrack ? (
        <FeaturedArtistsModal
          track={featuredTrack}
          onClose={() => setFeaturedTrack(null)}
          onSave={(artistNames) => saveFeaturedArtists.mutate(artistNames)}
          isSaving={saveFeaturedArtists.isPending}
        />
      ) : null}

      {editAlbumId
        ? (() => {
            const al = artist.albums.find((a) => a.id === editAlbumId);
            if (!al) return null;
            return (
              <AlbumModal
                album={al}
                artistAlbums={artist.albums}
                artistTracks={artist.tracks}
                onClose={() => setEditAlbumId(null)}
                onChange={invalidate}
              />
            );
          })()
        : null}
      {creatingAlbum ? (
        <CreateAlbumModal
          artistId={artistId}
          onClose={() => setCreatingAlbum(false)}
          onCreated={invalidate}
        />
      ) : null}
    </div>
  );
}

// ── Create artist modal ─────────────────────────────────────────────────────────
function CreateArtistModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    src: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const genreSuggestionsQ = useQuery({
    queryKey: ["catalog", "genres"],
    queryFn: listCatalogGenres,
    staleTime: 60_000,
  });

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

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

  const create = useMutation({
    mutationFn: async () => {
      const res = await createArtist({
        name: name.trim(),
        bio: bio.trim() || undefined,
        genres,
      });
      // A photo (if chosen) needs the new artist's id, so it's a second step.
      if (file && res.id) {
        try {
          await uploadArtistImage(res.id, file);
        } catch {
          /* the artist was created; the photo can be retried in the editor */
        }
      }
      return res;
    },
    onSuccess: (res) => onCreated(res.id),
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "No se pudo crear el artista.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const canSubmit = name.trim().length > 0 && !create.isPending;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {t("catalog.newArtistTitle", { defaultValue: "Nuevo artista" })}
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
            <div className="flex gap-4">
              {/* Photo — the whole circle is a click-to-upload dropzone. */}
              <div className="flex flex-col items-center gap-2">
                <label
                  title={t("catalog.uploadArtistImage", {
                    defaultValue: "Subir foto del artista",
                  })}
                  className="group relative h-28 w-28 flex-none cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-[var(--color-line)] bg-[var(--color-surface-alt)] transition hover:border-[var(--color-primary)]"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : null}
                  {/* Overlay: prompt when empty, "change" hint on hover when set */}
                  <span
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--color-muted)] transition ${
                      previewUrl
                        ? "bg-black/45 text-white opacity-0 group-hover:opacity-100"
                        : "group-hover:text-[var(--color-primary)]"
                    }`}
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-[10px] font-semibold">
                      {previewUrl
                        ? t("catalog.changePhoto", { defaultValue: "Cambiar" })
                        : t("catalog.uploadPhoto", {
                            defaultValue: "Subir foto",
                          })}
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/avif,image/webp,.avif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        setPendingPhoto({
                          src: URL.createObjectURL(f),
                          fileName: f.name,
                        });
                      e.target.value = "";
                    }}
                  />
                </label>
                {file ? (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[10px] font-semibold text-rose-400 hover:underline"
                  >
                    {t("catalog.removePhoto", { defaultValue: "Quitar foto" })}
                  </button>
                ) : (
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Foto AVIF/WEBP, 640×637 px
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="flex flex-1 flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    {t("catalog.name", { defaultValue: "Nombre" })} *
                  </span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) create.mutate();
                    }}
                    placeholder={t("catalog.namePlaceholder", {
                      defaultValue: "Nombre del artista",
                    })}
                    className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
              </div>
            </div>

            {/* Genres */}
            <div className="mt-4 flex flex-col gap-1.5">
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
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <input
                  list="create-artist-genres"
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
                <datalist id="create-artist-genres">
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

            {/* Bio */}
            <label className="mt-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {t("catalog.bio", { defaultValue: "Bio" })}
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder={t("catalog.bioPlaceholder", {
                  defaultValue: "Breve descripción del artista…",
                })}
                className="resize-y rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            {error ? (
              <p className="mt-3 text-xs text-rose-400">{error}</p>
            ) : null}
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
              onClick={() => create.mutate()}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] disabled:opacity-50"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {t("catalog.createArtist", { defaultValue: "Crear artista" })}
            </button>
          </div>
        </div>
      </div>
      {pendingPhoto ? (
        <ImageCropModal
          src={pendingPhoto.src}
          fileName={pendingPhoto.fileName}
          round
          onCancel={() => {
            URL.revokeObjectURL(pendingPhoto.src);
            setPendingPhoto(null);
          }}
          onConfirm={(cropped) => {
            URL.revokeObjectURL(pendingPhoto.src);
            setFile(cropped);
            setPendingPhoto(null);
          }}
        />
      ) : null}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [syncSummary, setSyncSummary] = useState<
    CatalogSyncResult["summary"] | null
  >(null);
  const syncR2 = useMutation({
    mutationFn: syncCatalogFromR2,
    onSuccess: async ({ completed, summary }) => {
      setSyncSummary(summary);
      await qc.invalidateQueries({ queryKey: ["catalog"] });
      showActionNotice(
        completed
          ? "Catálogo sincronizado desde Cloudflare R2"
          : "Sincronización incompleta: revisa los datos de integridad",
        completed ? "success" : "error",
      );
    },
    onError: () =>
      showActionNotice("No se pudo sincronizar el catálogo", "error"),
  });
  const artistsQ = useQuery({
    queryKey: ["catalog", "artists"],
    queryFn: listCatalogArtists,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(0);

  const artists = artistsQ.data ?? EMPTY_ARTISTS;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artists.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.genres ?? []).some((genre) => genre.toLowerCase().includes(q))
      );
    });
  }, [artists, search]);

  // Page the (filtered) list so the column never turns into an endless scroll.
  const ARTISTS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTISTS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(
    safePage * ARTISTS_PER_PAGE,
    safePage * ARTISTS_PER_PAGE + ARTISTS_PER_PAGE,
  );

  // Reset to the first page whenever the filters change the result set.
  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    if (!selected && filtered.length) setSelected(filtered[0].id);
  }, [filtered, selected]);

  function handleArtistCreated(id: string) {
    setCreating(false);
    void qc.invalidateQueries({ queryKey: ["catalog", "artists"] });
    void qc.invalidateQueries({ queryKey: ["catalog", "genres"] });
    setSelected(id);
  }
  const removeArtist = useMutation({
    mutationFn: (id: string) => deleteArtist(id),
    onSuccess: () => {
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["catalog", "artists"] });
      void qc.invalidateQueries({ queryKey: ["globalSearch"] });
    },
  });

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <button
          type="button"
          onClick={() => syncR2.mutate()}
          disabled={syncR2.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/20 disabled:cursor-wait disabled:opacity-60"
        >
          {syncR2.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {syncR2.isPending ? "Sincronizando…" : "Sync R2"}
        </button>
      </div>
      {syncSummary ? (
        <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3 text-sm text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-text)]">
            Resultado de la última sincronización:
          </span>{" "}
          {syncSummary.tracks
            ? `${syncSummary.tracks.created} canciones nuevas, ${syncSummary.tracks.refreshed} actualizadas y ${syncSummary.tracks.removedFromCatalog} retiradas del catálogo.`
            : "canciones procesadas."}{" "}
          {syncSummary.albums
            ? `${syncSummary.albums.created} álbumes creados y ${syncSummary.albums.updated} actualizados.`
            : ""}{" "}
          {syncSummary.lyrics
            ? `${syncSummary.lyrics.synchronized} letras asociadas y ${syncSummary.lyrics.unmatched} pendientes de asociar.`
            : ""}
          {syncSummary.integrity
            ? ` Integridad: ${syncSummary.integrity.artistImagesMissing} artistas sin foto, ${syncSummary.integrity.albumsIncomplete} álbumes incompletos, ${syncSummary.integrity.trackCoverMismatches} portadas inconsistentes, ${syncSummary.integrity.trackCoversRepaired} portadas corregidas y ${syncSummary.integrity.duplicateArtists} grupos duplicados.`
            : ""}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Artists list */}
        <div className="flex h-[min(560px,calc(100vh-12rem))] self-start flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-glass)] p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar artista o género…"
            className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          />
          {search ? (
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
                }}
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t("catalog.clearFilters", { defaultValue: "Limpiar" })}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            {t("catalog.newArtist", { defaultValue: "Nuevo artista" })}
          </button>
          <div className="flex flex-none flex-col gap-0.5 overflow-visible">
            {(artistsQ.isLoading ? [] : pageItems).map((a: CatalogArtist) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                  selected === a.id
                    ? "bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                    : "hover:bg-white/[0.05]"
                }`}
              >
                <span className="h-8 w-8 flex-none overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
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
                    <span className="hidden">
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
          {artistsQ.isError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-semibold text-rose-400">
                No se pudo cargar el catálogo administrativo.
              </p>
              <p className="max-w-md text-xs text-[var(--color-muted)]">
                Verifica que el backend esté actualizado y vuelve a intentarlo.
              </p>
              <button
                type="button"
                onClick={() => void artistsQ.refetch()}
                className="rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)]"
              >
                Reintentar
              </button>
            </div>
          ) : selected ? (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        t("catalog.deleteArtistConfirm", {
                          defaultValue:
                            "¿Eliminar este artista y todas sus canciones? Esta acción no se puede deshacer.",
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

      {creating ? (
        <CreateArtistModal
          onClose={() => setCreating(false)}
          onCreated={handleArtistCreated}
        />
      ) : null}
    </div>
  );
}
