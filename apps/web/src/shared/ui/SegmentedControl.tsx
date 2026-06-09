type SegmentedControlProps<T extends string> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  /** Optional aria-label for the group when no visible heading describes it. */
  ariaLabel?: string;
};

/**
 * Tabbed pill group. One option active at a time. Used for personalization
 * toggles (Density, Hero variant, Sidebar layout, etc.) and any other 2–4
 * choice picker that benefits from being instantly switchable.
 *
 * Generic over T so the caller's union type carries through `onChange`.
 */
export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
