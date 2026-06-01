import {
  AlertCircle,
  ChevronDown,
  Music2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ClientLayout from "../../layout/ClientLayout";
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

// ─── Constants ────────────────────────────────────────────────────────────────

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

const SEGMENT_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
] as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

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

// ─── Editor form state ────────────────────────────────────────────────────────

interface EditorState {
  segmentId: string | null; // null = creating new
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full rounded-xl bg-[var(--color-surface-alt)]" />
      <div className="h-24 w-full rounded-2xl bg-[var(--color-surface-alt)]" />
      <div className="h-48 w-full rounded-2xl bg-[var(--color-surface-alt)]" />
    </div>
  );
}

function TrackSelector({
  tracks,
  selectedId,
  onSelect,
}: {
  tracks: Track[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = tracks.find((t) => t.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
      >
        <span className="flex items-center gap-2 truncate">
          <Music2
            className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
            strokeWidth={2}
          />
          {selected
            ? `${selected.title} — ${selected.artist}`
            : "Selecciona una canción…"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          {tracks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-[var(--color-surface-alt)] ${
                  t.id === selectedId
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text)]"
                }`}
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-[var(--color-muted)]">
                  {t.artist}
                </span>
              </button>
            </li>
          ))}
          {tracks.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--color-muted)]">
              Sin canciones
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface DragState {
  startX: number;
  currentX: number;
  width: number;
}

function Timeline({
  segments,
  durationMs,
  addingMode,
  onSegmentClick,
  onDragComplete,
}: {
  segments: EQSegment[];
  durationMs: number;
  addingMode: boolean;
  onSegmentClick: (seg: EQSegment) => void;
  onDragComplete: (startMs: number, endMs: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toMs = useCallback(
    (clientX: number): number => {
      if (!railRef.current) return 0;
      const rect = railRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return Math.round(ratio * durationMs);
    },
    [durationMs],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!addingMode) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const x = e.clientX;
      if (railRef.current) {
        const rect = railRef.current.getBoundingClientRect();
        setDrag({
          startX: x - rect.left,
          currentX: x - rect.left,
          width: rect.width,
        });
      }
    },
    [addingMode],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag || !railRef.current) return;
      const rect = railRef.current.getBoundingClientRect();
      setDrag((prev) => {
        if (!prev) return prev;
        return { ...prev, currentX: e.clientX - rect.left };
      });
    },
    [drag],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const startMs = toMs(
        drag.startX + (railRef.current?.getBoundingClientRect().left ?? 0),
      );
      const endMs = toMs(e.clientX);
      setDrag(null);
      const [lo, hi] = startMs < endMs ? [startMs, endMs] : [endMs, startMs];
      if (hi - lo > 500) {
        onDragComplete(lo, hi);
      }
    },
    [drag, toMs, onDragComplete],
  );

  const dragLeft = drag
    ? `${(Math.min(drag.startX, drag.currentX) / drag.width) * 100}%`
    : "0%";
  const dragWidth = drag
    ? `${(Math.abs(drag.currentX - drag.startX) / drag.width) * 100}%`
    : "0%";

  return (
    <div
      ref={railRef}
      className={`relative h-12 w-full select-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] ${
        addingMode ? "cursor-crosshair" : "cursor-default"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Segments */}
      {segments.map((seg, i) => {
        const left = (seg.startMs / durationMs) * 100;
        const width = ((seg.endMs - seg.startMs) / durationMs) * 100;
        const colorClass = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        const isHovered = hoveredId === seg.id;

        return (
          <div
            key={seg.id}
            className={`absolute inset-y-1 flex cursor-pointer items-center justify-center rounded-lg opacity-80 transition hover:opacity-100 ${colorClass}`}
            style={{ left: `${left}%`, width: `${width}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSegmentClick(seg);
            }}
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Label inside if wide enough */}
            <span
              className="truncate px-1 text-[10px] font-bold text-white"
              style={{ fontSize: "10px" }}
            >
              {seg.label ?? ""}
            </span>

            {/* Hover tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-xl">
                <p className="font-semibold text-[var(--color-text)]">
                  {seg.label || "(sin nombre)"}
                </p>
                <p className="text-[var(--color-muted)]">
                  {formatMs(seg.startMs)} → {formatMs(seg.endMs)}
                </p>
                <p className="text-[var(--color-muted)]">
                  Bands: {seg.eqConfig.bands.slice(0, 3).join(", ")}…
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Drag overlay */}
      {drag && (
        <div
          className="pointer-events-none absolute inset-y-1 rounded-lg bg-[var(--color-primary)] opacity-30"
          style={{ left: dragLeft, width: dragWidth }}
        />
      )}
    </div>
  );
}

// ─── Editor modal ─────────────────────────────────────────────────────────────

function EditorModal({
  state,
  onChange,
  onSave,
  onDelete,
  onCancel,
  isSaving,
  isDeleting,
  error,
}: {
  state: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
}) {
  const isEdit = state.segmentId !== null;

  function bandChange(index: number, value: number) {
    const next = [...state.bands];
    next[index] = value;
    onChange({ bands: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {isEdit ? "Editar segmento" : "Nuevo segmento"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
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

        {/* Label */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Nombre del segmento
          </label>
          <input
            type="text"
            value={state.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Intro, Chorus, Bridge…"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Times */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              { key: "startMs" as const, label: "Inicio (ms)" },
              { key: "endMs" as const, label: "Fin (ms)" },
              { key: "transitionMs" as const, label: "Transición (ms)" },
            ] as { key: "startMs" | "endMs" | "transitionMs"; label: string }[]
          ).map(({ key, label }) => (
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

        {/* EQ Bands */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Bandas de EQ (−15 a +15 dB)
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

        {/* Effects */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          {(
            [
              { key: "bassBoost" as const, label: "Bass Boost" },
              { key: "virtualizer" as const, label: "Virtualizer" },
              { key: "loudness" as const, label: "Loudness" },
            ] as {
              key: "bassBoost" | "virtualizer" | "loudness";
              label: string;
            }[]
          ).map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                <span>{label}</span>
                <span className="text-[var(--color-primary)]">
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
              Reverb Preset
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
                  {p.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              <span>Reverb Amount</span>
              <span className="text-[var(--color-primary)]">
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

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[linear-gradient(180deg,var(--color-cta-start)_0%,var(--color-cta-end)_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)] transition hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
          >
            Cancelar
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {isDeleting ? "…" : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Segments() {
  const queryClient = useQueryClient();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const tracksQuery = useQuery({
    queryKey: ["tracks"],
    queryFn: () => listTracks({ take: 100 }),
  });

  const tracks = tracksQuery.data?.tracks ?? [];
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;

  const segmentsQuery = useQuery({
    queryKey: ["segments", selectedTrackId],
    queryFn: () => listSegments(selectedTrackId!),
    enabled: selectedTrackId !== null,
  });

  const segments = segmentsQuery.data ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────────

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
      if (status === 409) return "El segmento se superpone con uno existente.";
      if (status === 400) {
        const msg = axiosErr.response?.data?.message;
        return typeof msg === "string"
          ? msg
          : "Datos inválidos. Revisa los valores.";
      }
    }
    return "Error inesperado. Intenta de nuevo.";
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateSegmentPayload) => createSegment(payload),
    onSuccess: () => {
      invalidateSegments();
      setEditor(null);
      setEditorError(null);
    },
    onError: (err: unknown) => {
      setEditorError(extractErrorMessage(err));
    },
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
    onError: (err: unknown) => {
      setEditorError(extractErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSegment(id),
    onSuccess: () => {
      invalidateSegments();
      setEditor(null);
      setPendingDeleteId(null);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

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

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ClientLayout>
      <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-page)_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-[42px]">
              Editor de Segmentos
            </h1>
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Define zonas de tiempo con EQ independiente para cada canción.
            </p>
          </div>

          {/* Track selector */}
          {tracksQuery.isLoading ? (
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--color-surface-alt)]" />
          ) : (
            <TrackSelector
              tracks={tracks}
              selectedId={selectedTrackId}
              onSelect={(id) => {
                setSelectedTrackId(id);
                setEditor(null);
                setAddingMode(false);
              }}
            />
          )}

          {/* Empty state — no track selected */}
          {!selectedTrackId && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
              <Music2
                className="h-10 w-10 text-[var(--color-muted)]"
                strokeWidth={1.5}
              />
              <p className="text-base font-medium text-[var(--color-muted)]">
                Selecciona una canción para editar sus segmentos de EQ.
              </p>
            </div>
          )}

          {/* Content when track selected */}
          {selectedTrackId && selectedTrack && (
            <>
              {/* Track info + add button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-muted)]">
                  {selectedTrack.title} — {selectedTrack.artist} •{" "}
                  {formatMs(selectedTrack.durationMs)}
                </p>
                <button
                  type="button"
                  onClick={() => setAddingMode((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    addingMode
                      ? "border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  {addingMode ? "Arrastra en la línea…" : "Nuevo segmento"}
                </button>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Línea de tiempo — {formatMs(selectedTrack.durationMs)}
                </p>

                {segmentsQuery.isLoading ? (
                  <LoadingSkeleton />
                ) : segmentsQuery.isError ? (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    Error al cargar segmentos.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => void segmentsQuery.refetch()}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <Timeline
                    segments={segments}
                    durationMs={selectedTrack.durationMs}
                    addingMode={addingMode}
                    onSegmentClick={handleSegmentClick}
                    onDragComplete={handleDragComplete}
                  />
                )}
              </div>

              {/* Segments list */}
              {!segmentsQuery.isLoading && !segmentsQuery.isError && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Segmentos ({segments.length})
                  </p>

                  {segments.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                      Esta canción aún no tiene segmentos. Crea el primero
                      arrastrando en la línea de tiempo.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                            <th className="pb-3 pr-4">Nombre</th>
                            <th className="pb-3 pr-4">Rango</th>
                            <th className="pb-3 pr-4">Duración</th>
                            <th className="pb-3 pr-4">Origen</th>
                            <th className="pb-3">Acciones</th>
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
                                      Sin nombre
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
                                        ? "bg-violet-500/15 text-violet-400"
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
                                      title="Editar"
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
                                      title="Eliminar"
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

      {/* Delete confirm banner */}
      {pendingDeleteId && !editor && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-red-500/40 bg-[var(--color-surface)] px-5 py-3 shadow-2xl">
          <span className="text-sm text-[var(--color-text)]">
            ¿Eliminar este segmento?
          </span>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(pendingDeleteId)}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setPendingDeleteId(null)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Editor modal */}
      {editor && (
        <EditorModal
          state={editor}
          onChange={handleEditorChange}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => {
            setEditor(null);
            setEditorError(null);
            setPendingDeleteId(null);
          }}
          isSaving={isSaving}
          isDeleting={isDeleting}
          error={
            editorError ??
            (pendingDeleteId === editor.segmentId
              ? "¿Confirmas la eliminación? Presiona Eliminar de nuevo."
              : null)
          }
        />
      )}
    </ClientLayout>
  );
}
