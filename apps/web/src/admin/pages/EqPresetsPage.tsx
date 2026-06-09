import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  createGlobalPreset,
  deleteGlobalPreset,
  listGlobalPresets,
  REVERB_PRESETS,
  updateGlobalPreset,
} from "../../shared/api/admin";
import type {
  GlobalEqPreset,
  GlobalEqPresetPayload,
  ReverbPreset,
} from "../../shared/api/admin";

// 10 ISO bands the Web Audio EQ uses on the client side.
const BAND_LABELS = [
  "31",
  "62",
  "125",
  "250",
  "500",
  "1k",
  "2k",
  "4k",
  "8k",
  "16k",
];

const EMPTY_DRAFT: PresetDraft = {
  name: "",
  bands: Array.from({ length: 10 }, () => 0),
  bassBoost: 0,
  virtualizer: 0,
  loudness: 0,
  reverbPreset: "NONE",
  reverbAmount: 0,
};

interface PresetDraft {
  name: string;
  bands: number[];
  bassBoost: number;
  virtualizer: number;
  loudness: number;
  reverbPreset: ReverbPreset;
  reverbAmount: number;
}

function toDraft(p: GlobalEqPreset): PresetDraft {
  return {
    name: p.name,
    bands: Array.isArray(p.bands) ? [...p.bands] : EMPTY_DRAFT.bands,
    bassBoost: p.bassBoost ?? 0,
    virtualizer: p.virtualizer ?? 0,
    loudness: p.loudness ?? 0,
    reverbPreset: p.reverbPreset ?? "NONE",
    reverbAmount: p.reverbAmount ?? 0,
  };
}

function draftToPayload(d: PresetDraft): GlobalEqPresetPayload {
  return {
    name: d.name.trim(),
    bands: d.bands,
    bassBoost: d.bassBoost,
    virtualizer: d.virtualizer,
    loudness: d.loudness,
    reverbPreset: d.reverbPreset,
    reverbAmount: d.reverbAmount,
  };
}

function isDirty(a: PresetDraft, b: PresetDraft): boolean {
  return (
    a.name !== b.name ||
    a.bassBoost !== b.bassBoost ||
    a.virtualizer !== b.virtualizer ||
    a.loudness !== b.loudness ||
    a.reverbPreset !== b.reverbPreset ||
    a.reverbAmount !== b.reverbAmount ||
    a.bands.some((v, i) => v !== b.bands[i])
  );
}

function BandsEditor({
  bands,
  onChange,
}: {
  bands: number[];
  onChange: (next: number[]) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-10 gap-1">
      {bands.map((db, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[10px] tabular-nums text-[var(--color-muted)]">
            {db > 0 ? `+${db}` : db}
          </span>
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={db}
            onChange={(e) => {
              const next = [...bands];
              next[i] = Number(e.currentTarget.value);
              onChange(next);
            }}
            className="h-24 w-2 cursor-pointer appearance-none accent-[var(--color-primary)]"
            // Vertical orientation via CSS writing-mode is buggy across browsers;
            // we rotate visually with transform instead.
            style={{ writingMode: "vertical-lr" as const, direction: "rtl" }}
            aria-label={t("admin.eqPresets.bandLabel", { hz: BAND_LABELS[i] })}
          />
          <span className="text-[10px] text-[var(--color-muted)]">
            {BAND_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function KnobRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-3 text-xs text-[var(--color-text)]">
      <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="flex-1 accent-[var(--color-primary)]"
      />
      <span className="w-10 shrink-0 text-right tabular-nums">{value}</span>
    </label>
  );
}

function PresetEditor({
  draft,
  setDraft,
  showNameField,
}: {
  draft: PresetDraft;
  setDraft: (next: PresetDraft) => void;
  showNameField: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      {showNameField && (
        <label className="flex items-center gap-2 text-xs text-[var(--color-text)]">
          <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
            {t("admin.eqPresets.name")}
          </span>
          <input
            value={draft.name}
            onChange={(e) =>
              setDraft({ ...draft, name: e.currentTarget.value })
            }
            maxLength={60}
            placeholder={t("admin.eqPresets.namePlaceholder")}
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </label>
      )}

      <BandsEditor
        bands={draft.bands}
        onChange={(next) => setDraft({ ...draft, bands: next })}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <KnobRow
          label={t("admin.eqPresets.bassBoost")}
          value={draft.bassBoost}
          onChange={(v) => setDraft({ ...draft, bassBoost: v })}
        />
        <KnobRow
          label={t("admin.eqPresets.virtualizer")}
          value={draft.virtualizer}
          onChange={(v) => setDraft({ ...draft, virtualizer: v })}
        />
        <KnobRow
          label={t("admin.eqPresets.loudness")}
          value={draft.loudness}
          onChange={(v) => setDraft({ ...draft, loudness: v })}
        />
        <KnobRow
          label={t("admin.eqPresets.reverbAmount")}
          value={draft.reverbAmount}
          onChange={(v) => setDraft({ ...draft, reverbAmount: v })}
        />
      </div>

      <label className="flex items-center gap-3 text-xs text-[var(--color-text)]">
        <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {t("admin.eqPresets.reverbType")}
        </span>
        <select
          value={draft.reverbPreset}
          onChange={(e) =>
            setDraft({
              ...draft,
              reverbPreset: e.currentTarget.value as ReverbPreset,
            })
          }
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-page)] px-2 py-1 text-xs"
        >
          {REVERB_PRESETS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PresetRow({ preset }: { preset: GlobalEqPreset }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const original = useMemo(() => toDraft(preset), [preset]);
  const [draft, setDraft] = useState<PresetDraft>(original);
  const [expanded, setExpanded] = useState(false);
  const dirty = isDirty(draft, original);

  const saveM = useMutation({
    mutationFn: () => updateGlobalPreset(preset.id, draftToPayload(draft)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "eq-presets"] });
    },
  });
  const deleteM = useMutation({
    mutationFn: () => deleteGlobalPreset(preset.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "eq-presets"] });
    },
  });

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button,input,select,label"))
            return;
          setExpanded((v) => !v);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {preset.name}
          </p>
          <p className="text-[10px] text-[var(--color-muted)]">
            {t("admin.eqPresets.bandsSummary", {
              values: draft.bands.map((b) => (b > 0 ? `+${b}` : b)).join(" "),
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => setDraft(original)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              title={t("admin.eqPresets.discardTooltip")}
            >
              <RotateCcw className="h-3 w-3" /> {t("admin.eqPresets.discard")}
            </button>
          )}
          <button
            type="button"
            onClick={() => saveM.mutate()}
            disabled={!dirty || saveM.isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-30"
          >
            {saveM.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {t("admin.eqPresets.save")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  t("admin.eqPresets.deleteConfirm", { name: preset.name }),
                )
              )
                deleteM.mutate();
            }}
            disabled={deleteM.isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
          >
            {deleteM.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </header>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <PresetEditor
            draft={draft}
            setDraft={setDraft}
            showNameField={true}
          />
          {saveM.isError && (
            <p className="mt-3 text-xs text-rose-300">
              {t("admin.eqPresets.saveError")}:{" "}
              {(saveM.error as Error)?.message}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function CreatePresetCard() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PresetDraft>(EMPTY_DRAFT);

  const createM = useMutation({
    mutationFn: () => createGlobalPreset(draftToPayload(draft)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "eq-presets"] });
      setDraft(EMPTY_DRAFT);
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-transparent px-4 py-6 text-sm font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary)]/60 hover:text-[var(--color-text)]"
      >
        <Plus className="h-4 w-4" /> {t("admin.eqPresets.create")}
      </button>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface-alt)] p-4">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
        {t("admin.eqPresets.createTitle")}
      </h3>
      <PresetEditor draft={draft} setDraft={setDraft} showNameField={true} />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setDraft(EMPTY_DRAFT);
          }}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          {t("admin.eqPresets.cancel")}
        </button>
        <button
          type="button"
          onClick={() => createM.mutate()}
          disabled={!draft.name.trim() || createM.isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-40"
        >
          {createM.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {t("admin.eqPresets.create2")}
        </button>
      </div>
      {createM.isError && (
        <p className="mt-2 text-xs text-rose-300">
          {t("admin.eqPresets.createError")}:{" "}
          {(createM.error as Error)?.message}
        </p>
      )}
    </article>
  );
}

export default function EqPresetsPage() {
  const { t } = useTranslation();
  const listQ = useQuery<GlobalEqPreset[]>({
    queryKey: ["admin", "eq-presets"],
    queryFn: listGlobalPresets,
    staleTime: 30_000,
  });

  return (
    <section className="min-h-screen w-full bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {t("admin.eqPresets.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("admin.eqPresets.subtitle")}
          </p>
        </header>

        <CreatePresetCard />

        {listQ.isPending && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("admin.eqPresets.loading")}
          </div>
        )}

        {listQ.isError && (
          <p className="text-xs text-rose-300">
            {t("admin.eqPresets.loadError")}
          </p>
        )}

        {listQ.data && (
          <div className="flex flex-col gap-3">
            {listQ.data.map((p) => (
              <PresetRow key={p.id} preset={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
