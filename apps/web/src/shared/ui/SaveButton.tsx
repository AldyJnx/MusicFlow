import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToggleSave } from "../hooks/useLibrarySaves";

interface SaveButtonProps {
  trackId: string;
  saved: boolean;
  size?: "sm" | "md";
}

export default function SaveButton({
  trackId,
  saved,
  size = "sm",
}: SaveButtonProps) {
  const { t } = useTranslation();
  const toggle = useToggleSave();
  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ trackId, saved });
      }}
      disabled={toggle.isPending}
      aria-pressed={saved}
      aria-label={
        saved
          ? t("library.saves.removeAria", {
              defaultValue: "Quitar de Mi biblioteca",
            })
          : t("library.saves.addAria", {
              defaultValue: "Guardar en Mi biblioteca",
            })
      }
      className={`inline-flex ${dim} items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        saved
          ? "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
          : "text-[var(--color-muted)] hover:bg-white/[0.06] hover:text-[var(--color-text)]"
      }`}
    >
      <Heart
        className={icon}
        strokeWidth={2.2}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}
