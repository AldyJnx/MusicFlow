import {
  AlertCircle,
  ChevronDown,
  Music2,
  PencilLine,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import ClientLayout from "../../layout/ClientLayout";
import PremiumLockedPage from "../billing/PremiumLockedPage";
import { usePremiumGate } from "../../../shared/hooks/usePremiumGate";
import { usePlayerStore, type PlayerTrack } from "../../stores/playStore";
import { getAudioEngine } from "../../../audio/engine";
import WaveformTimeline from "./WaveformTimeline";
import type { Track } from "../../../shared/api/tracks";
import { listTracks } from "../../../shared/api/tracks";
import type {
  CreateSegmentPayload,
  EQSegment,
  ReverbPresetSeg,
  UpdateSegmentPayload,
} from "../../../shared/api/segments";
import {
  createSegment,
  deleteSegment,
  listSegments,
  updateSegment,
} from "../../../shared/api/segments";

const FREQ_LABELS = [
  "31",
  "63",
  "125",
  "250",
  "500",
  "1k",
  "2k",
  "4k",
  "8k",
  "16k",
] as const;

const REVERB_PRESETS: ReverbPresetSeg[] = [
  "NONE",
  "SMALL_ROOM",
  "MEDIUM_ROOM",
  "LARGE_ROOM",
  "SMALL_HALL",
  "LARGE_HALL",
  "CATHEDRAL",
  "PLATE",
  "SPRING",
];

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const millis = ms % 1000;
  const mm = String(minutes).padStart(1, "0");
  const ss = String(seconds).padStart(2, "0");
  const sss = String(millis).padStart(3, "0");
  return `${mm}:${ss}.${sss}`;
}

function defaultBands(): number[] {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

interface EditorState {
  segmentId: string | null;
  label: string;
  startMs: number;
  endMs: number;
  transitionMs: number;
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPresetSeg;
  reverbAmount: number;
}

function makeEditorFromSegment(seg: EQSegment): EditorState {
  return {
    segmentId: seg.id,
    label: seg.label ?? "",
    startMs: seg.startMs,
    endMs: seg.endMs,
    transitionMs: seg.transitionMs,
    bands:
      seg.eqConfig.bands.length === 10
        ? [...seg.eqConfig.bands]
        : defaultBands(),
    bassBoost: seg.eqConfig.bassBoost,
    virtualizer: seg.eqConfig.virtualizer,
    loudness: seg.eqConfig.loudness,
    reverbPreset: seg.eqConfig.reverbPreset,
    reverbAmount: seg.eqConfig.reverbAmount,
  };
}

function makeEditorNew(startMs: number, endMs: number): EditorState {
  return {
    segmentId: null,
    label: "",
    startMs,
    endMs,
    transitionMs: 500,
    bands: defaultBands(),
    bassBoost: 0,
    virtualizer: 0,
    loudness: 0,
    reverbPreset: "NONE",
    reverbAmount: 0,
  };
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full rounded-xl bg-[var(--color-surface-alt)]" />
      <div className="h-24 w-full rounded-2xl bg-[var(--color-surface-alt)]" />
      <div className="h-48 w-full rounded-2xl bg-[var(--color-surface-alt)]" />
    </div>
  );
}

/**
 * Visual track picker — a grid of cover cards instead of a dropdown.
 * Built-in search filter so the user can find a song quickly when their
 * library is large. When a track is selected the parent renders
 * `<SelectedTrackHeader>` instead of this picker.
 */
function TrackPicker({
  tracks,
  onSelect,
}: {
  tracks: Track[];
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (tr) =>
        tr.title.toLowerCase().includes(q) ||
        tr.artist.toLowerCase().includes(q) ||
        (tr.album ?? "").toLowerCase().includes(q),
    );
  }, [tracks, query]);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
        <Music2
          className="h-10 w-10 text-[var(--color-muted)]"
          strokeWidth={1.5}
        />
        <p className="text-base font-medium text-[var(--color-muted)]">
          {t("segments.noTracks")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {t("segments.pickATrack", { defaultValue: "Elegí una canción" })}
        </p>
        <div className="relative">
          <Music2
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("segments.searchPlaceholder", {
              defaultValue: "Buscar por título, artista o álbum…",
            })}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] pl-10 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          {t("segments.noMatches", {
            defaultValue: "Ninguna canción coincide con la búsqueda.",
          })}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((tr) => (
            <li key={tr.id}>
              <button
                type="button"
                onClick={() => onSelect(tr.id)}
                className="group flex w-full flex-col gap-3 rounded-2xl bg-[var(--color-surface)] p-3 text-left transition hover:-translate-y-1 hover:bg-[var(--color-surface-alt)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-surface-alt)]">
                  {tr.coverArt ? (
                    <img
                      src={tr.coverArt}
                      alt={tr.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music2
                        className="h-10 w-10 text-[var(--color-muted)]"
                        strokeWidth={1.4}
                      />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">
                    {tr.title}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {tr.artist}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Header rendered after a track has been picked. Big cover, name, "change
 * track" affordance — gives the segment editor the same protagonist feel
 * the ExpandedPlayer has, so the user knows exactly which song they're
 * editing.
 */
function SelectedTrackHeader({
  track,
  onClear,
}: {
  track: Track;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface-alt)] shadow-[0_14px_30px_rgba(0,0,0,0.32)] sm:h-32 sm:w-32">
        {track.coverArt ? (
          <img
            src={track.coverArt}
            alt={track.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2
              className="h-10 w-10 text-[var(--color-muted)]"
              strokeWidth={1.4}
            />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {t("segments.editingTrack", { defaultValue: "Editando canción" })}
        </p>
        <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
          {track.title}
        </h2>
        <p className="truncate text-sm text-[var(--color-muted)]">
          {track.artist}
          {track.album ? ` · ${track.album}` : ""} ·{" "}
          {formatMs(track.durationMs)}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)]"
      >
        <ChevronDown className="h-3.5 w-3.5 rotate-90" strokeWidth={2.4} />
        {t("segments.changeTrack", { defaultValue: "Cambiar canción" })}
      </button>
    </article>
  );
}

function EditorModal({
  state,
  onChange,
  onSave,
  onDelete,
  onCancel,
  onPreview,
  isSaving,
  isDeleting,
  isPreviewing,
  error,
}: {
  state: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  /** Plays the segment with the in-editor curve applied live to the engine. */
  onPreview: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isPreviewing: boolean;
  error: string | null;
}) {
  const { t } = useTranslation();
  const isEdit = state.segmentId !== null;

  function bandChange(index: number, value: number) {
    const next = [...state.bands];
    next[index] = value;
    onChange({ bands: next });
  }

  const timeFields = [
    { key: "startMs" as const, label: t("segments.editor.startMs") },
    { key: "endMs" as const, label: t("segments.editor.endMs") },
    { key: "transitionMs" as const, label: t("segments.editor.transitionMs") },
  ];

  const effectFields = [
    { key: "bassBoost" as const, label: t("eq.bassBoost") },
    { key: "virtualizer" as const, label: t("eq.virtualizer") },
    { key: "loudness" as const, label: t("eq.loudness") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {isEdit
              ? t("segments.editor.editTitle")
              : t("segments.editor.newTitle")}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t("segments.editor.label")}
          </label>
          <input
            type="text"
            value={state.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={t("segments.editor.labelPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {timeFields.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {label}
              </label>
              <input
                type="number"
                min={0}
                value={state[key]}
                onChange={(e) => onChange({ [key]: Number(e.target.value) })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                {formatMs(state[key])}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            {t("segments.editor.bandsHelp")}
          </p>
          <div className="grid grid-cols-10 gap-1">
            {FREQ_LABELS.map((freq, i) => (
              <div key={freq} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-semibold text-[var(--color-muted)]">
                  {(state.bands[i] ?? 0) > 0
                    ? `+${state.bands[i]}`
                    : (state.bands[i] ?? 0)}
                </span>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={1}
                  value={state.bands[i] ?? 0}
                  onChange={(e) => bandChange(i, Number(e.target.value))}
                  className="h-24 w-1.5 cursor-pointer accent-[var(--color-primary)]"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                />
                <span className="text-[9px] text-[var(--color-muted)]">
                  {freq}Hz
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          {effectFields.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <span>{label}</span>
                <span className="text-[var(--color-primary)] tabular-nums">
                  {state[key]}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={state[key]}
                onChange={(e) => onChange({ [key]: Number(e.target.value) })}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {t("eq.reverbPreset")}
            </label>
            <select
              value={state.reverbPreset}
              onChange={(e) =>
                onChange({ reverbPreset: e.target.value as ReverbPresetSeg })
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {REVERB_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {t(`eq.reverb.${p}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              <span>{t("eq.reverbAmount")}</span>
              <span className="text-[var(--color-primary)] tabular-nums">
                {state.reverbAmount}
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={state.reverbAmount}
              onChange={(e) =>
                onChange({ reverbAmount: Number(e.target.value) })
              }
              className="w-full accent-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreview}
            disabled={isPreviewing}
            title={t("segments.editor.previewHint", {
              defaultValue:
                "Reproduce el segmento aplicando estos ajustes en vivo",
            })}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20 disabled:opacity-50"
          >
            <Play
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
              fill="currentColor"
            />
            {isPreviewing
              ? t("segments.editor.previewing", { defaultValue: "Sonando…" })
              : t("segments.editor.preview", { defaultValue: "Probar" })}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? t("segments.editor.saving") : t("segments.editor.save")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
          >
            {t("segments.editor.cancel")}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              aria-label={t("segments.editor.delete")}
            >
              {isDeleting ? "…" : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Segments() {
  const { isPremium } = usePremiumGate();
  if (!isPremium) {
    return (
      <ClientLayout>
        <PremiumLockedPage feature="segments" />
      </ClientLayout>
    );
  }
  return <SegmentsContent />;
}

function SegmentsContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    searchParams.get("track"),
  );

  // If the route param changes after mount (e.g. user navigates again from
  // the player to a different track), follow it.
  useEffect(() => {
    const fromUrl = searchParams.get("track");
    if (fromUrl && fromUrl !== selectedTrackId) setSelectedTrackId(fromUrl);
    // selectedTrackId intentionally NOT in deps — we only want this to fire
    // when the URL changes, not when the user picks a track in the UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [addingMode, setAddingMode] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Player store hooks for the editor's "Probar" preview.
  const playTrack = usePlayerStore((s) => s.playTrack);
  const currentPlayingId = usePlayerStore((s) => s.currentTrack?.id ?? null);
  const seek = usePlayerStore((s) => s.seek);

  const tracksQuery = useQuery({
    queryKey: ["tracks"],
    queryFn: () => listTracks({ take: 100 }),
  });

  const tracks = tracksQuery.data?.tracks ?? [];
  const selectedTrack = tracks.find((tr) => tr.id === selectedTrackId) ?? null;

  const segmentsQuery = useQuery({
    queryKey: ["segments", selectedTrackId],
    queryFn: () => listSegments(selectedTrackId!),
    enabled: selectedTrackId !== null,
  });

  const segments = segmentsQuery.data ?? [];

  function invalidateSegments() {
    void queryClient.invalidateQueries({
      queryKey: ["segments", selectedTrackId],
    });
  }

  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosErr.response?.status;
      if (status === 409) return t("segments.editor.errorOverlap");
      if (status === 400) {
        const msg = axiosErr.response?.data?.message;
        return typeof msg === "string"
          ? msg
          : t("segments.editor.errorInvalid");
      }
    }
    return t("segments.editor.errorGeneric");
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSegmentPayload) => createSegment(payload),
    onSuccess: () => {
      invalidateSegments();
      setEditor(null);
      setEditorError(null);
    },
    onError: (err: unknown) => setEditorError(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSegmentPayload;
    }) => updateSegment(id, payload),
    onSuccess: () => {
      invalidateSegments();
      setEditor(null);
      setEditorError(null);
    },
    onError: (err: unknown) => setEditorError(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSegment(id),
    onSuccess: () => {
      invalidateSegments();
      setEditor(null);
      setPendingDeleteId(null);
    },
  });

  function handleDragComplete(startMs: number, endMs: number) {
    setAddingMode(false);
    setEditorError(null);
    setEditor(makeEditorNew(startMs, endMs));
  }

  function handleSegmentClick(seg: EQSegment) {
    setEditorError(null);
    setEditor(makeEditorFromSegment(seg));
  }

  function handleEditorChange(patch: Partial<EditorState>) {
    setEditor((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleSave() {
    if (!editor || !selectedTrackId) return;
    setEditorError(null);

    const eqConfig = {
      bands: editor.bands,
      bassBoost: editor.bassBoost,
      virtualizer: editor.virtualizer,
      loudness: editor.loudness,
      reverbPreset: editor.reverbPreset,
      reverbAmount: editor.reverbAmount,
    };

    if (editor.segmentId) {
      updateMutation.mutate({
        id: editor.segmentId,
        payload: {
          label: editor.label || undefined,
          startMs: editor.startMs,
          endMs: editor.endMs,
          transitionMs: editor.transitionMs,
          eqConfig,
        },
      });
    } else {
      createMutation.mutate({
        trackId: selectedTrackId,
        label: editor.label || undefined,
        startMs: editor.startMs,
        endMs: editor.endMs,
        transitionMs: editor.transitionMs,
        eqConfig,
      });
    }
  }

  function handleDelete() {
    if (!editor?.segmentId) return;
    if (pendingDeleteId === editor.segmentId) {
      deleteMutation.mutate(editor.segmentId);
    } else {
      setPendingDeleteId(editor.segmentId);
    }
  }

  /**
   * Live preview: push the editor's curve straight into the audio engine,
   * make sure the selected track is loaded, seek to the segment's start,
   * and play. The change is audible immediately — no save required.
   * Effects are routed through the engine too so reverb/loudness changes
   * are part of the preview.
   */
  async function handlePreview() {
    if (!editor || !selectedTrack) return;
    setIsPreviewing(true);
    try {
      const engine = getAudioEngine();
      engine.equalizer.setBands(editor.bands, 200);
      engine.setEffects({
        bassBoost: editor.bassBoost,
        virtualizer: editor.virtualizer,
        loudness: editor.loudness,
        reverbPreset: editor.reverbPreset,
        reverbAmount: editor.reverbAmount,
      });
      // If the track that's playing isn't the one we're editing, load it
      // first; otherwise just seek to where the segment begins.
      if (
        currentPlayingId !== selectedTrack.id &&
        selectedTrack.fileUrlRemote
      ) {
        const playable: PlayerTrack = {
          id: selectedTrack.id,
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          cover: selectedTrack.coverArt,
          url: selectedTrack.fileUrlRemote,
          durationMs: selectedTrack.durationMs,
        };
        await playTrack(playable);
      }
      seek(editor.startMs);
    } finally {
      // Brief debounce so users see "Sonando…" feedback even on fast paths.
      window.setTimeout(() => setIsPreviewing(false), 600);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-[42px]">
              {t("segments.title")}
            </h1>
            <p className="text-sm font-medium text-[var(--color-muted)]">
              {t("segments.subtitle")}
            </p>
          </div>

          {tracksQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-[var(--color-surface)] p-3"
                >
                  <div className="aspect-square rounded-xl bg-[var(--color-surface-alt)]" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-[var(--color-surface-alt)]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-alt)]" />
                </div>
              ))}
            </div>
          ) : selectedTrack ? (
            <SelectedTrackHeader
              track={selectedTrack}
              onClear={() => {
                setSelectedTrackId(null);
                setEditor(null);
                setAddingMode(false);
              }}
            />
          ) : (
            <TrackPicker
              tracks={tracks}
              onSelect={(id) => {
                setSelectedTrackId(id);
                setEditor(null);
                setAddingMode(false);
              }}
            />
          )}

          {selectedTrackId && selectedTrack && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-muted)]">
                  {selectedTrack.title} — {selectedTrack.artist} •{" "}
                  {formatMs(selectedTrack.durationMs)}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Placeholder for the future AI detection flow — fires
                      // the same quick-prompt modal we use elsewhere so the
                      // user can already ask the agent to suggest segments.
                      const open = (
                        window as unknown as { __mfOpenAi?: () => void }
                      ).__mfOpenAi;
                      if (typeof open === "function") open();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                    {t("segments.detectWithAi")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddingMode((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      addingMode
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    {addingMode
                      ? t("segments.dragInTimeline")
                      : t("segments.newSegment")}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  {t("segments.timeline")} —{" "}
                  {formatMs(selectedTrack.durationMs)}
                </p>

                {segmentsQuery.isLoading ? (
                  <LoadingSkeleton />
                ) : segmentsQuery.isError ? (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {t("segments.loadError")}{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => void segmentsQuery.refetch()}
                    >
                      {t("segments.retry")}
                    </button>
                  </div>
                ) : (
                  <WaveformTimeline
                    audioUrl={selectedTrack.fileUrlRemote}
                    precomputedPeaks={selectedTrack.peaks?.peaks ?? null}
                    durationMs={selectedTrack.durationMs}
                    segments={segments}
                    addingMode={addingMode}
                    onSegmentClick={handleSegmentClick}
                    onDragComplete={handleDragComplete}
                  />
                )}
              </div>

              {!segmentsQuery.isLoading && !segmentsQuery.isError && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    {t("segments.segmentsCount")} ({segments.length})
                  </p>

                  {segments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                      {t("segments.empty")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                            <th className="pb-3 pr-4">
                              {t("segments.table.name")}
                            </th>
                            <th className="pb-3 pr-4">
                              {t("segments.table.range")}
                            </th>
                            <th className="pb-3 pr-4">
                              {t("segments.table.duration")}
                            </th>
                            <th className="pb-3 pr-4">
                              {t("segments.table.source")}
                            </th>
                            <th className="pb-3">
                              {t("segments.table.actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {[...segments]
                            .sort((a, b) => a.startMs - b.startMs)
                            .map((seg) => (
                              <tr key={seg.id} className="group">
                                <td className="py-3 pr-4 font-medium text-[var(--color-text)]">
                                  {seg.label || (
                                    <span className="italic text-[var(--color-muted)]">
                                      {t("segments.table.unnamed")}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 pr-4 font-mono text-[var(--color-muted)]">
                                  {formatMs(seg.startMs)} →{" "}
                                  {formatMs(seg.endMs)}
                                </td>
                                <td className="py-3 pr-4 text-[var(--color-muted)]">
                                  {formatMs(seg.endMs - seg.startMs)}
                                </td>
                                <td className="py-3 pr-4">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                      seg.createdBy === "AI"
                                        ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                                        : "bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                                    }`}
                                  >
                                    {seg.createdBy}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSegmentClick(seg)}
                                      className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                                      title={t("segments.table.edit")}
                                    >
                                      <PencilLine className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditor(makeEditorFromSegment(seg));
                                        setPendingDeleteId(seg.id);
                                      }}
                                      className="rounded-lg p-1.5 text-[var(--color-muted)] transition hover:text-red-400"
                                      title={t("segments.table.delete")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {pendingDeleteId && !editor && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-red-500/40 bg-[var(--color-surface)] px-5 py-3 shadow-2xl">
          <span className="text-sm text-[var(--color-text)]">
            {t("segments.deleteConfirm")}
          </span>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(pendingDeleteId)}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
          >
            {t("segments.confirm")}
          </button>
          <button
            type="button"
            onClick={() => setPendingDeleteId(null)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
          >
            {t("segments.cancel")}
          </button>
        </div>
      )}

      {editor && (
        <EditorModal
          state={editor}
          onChange={handleEditorChange}
          onSave={handleSave}
          onDelete={handleDelete}
          onPreview={handlePreview}
          onCancel={() => {
            setEditor(null);
            setEditorError(null);
            setPendingDeleteId(null);
          }}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isPreviewing={isPreviewing}
          error={
            editorError ??
            (pendingDeleteId === editor.segmentId
              ? t("segments.deleteConfirm")
              : null)
          }
        />
      )}
    </ClientLayout>
  );
}
