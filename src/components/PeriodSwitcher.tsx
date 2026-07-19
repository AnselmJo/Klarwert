import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPeriodRange, shiftPeriod, type PeriodType } from "@/lib/periods";
import { usePeriodStore } from "@/stores/periodStore";

const TYPE_LABELS: Record<PeriodType, string> = {
  week: "Woche",
  month: "Monat",
  quarter: "Quartal",
  year: "Jahr",
};

/** C7 Zeitraum-Switcher – Zeitraum-Typ als Reihe einzeln umrandeter Boxen (A4), Zustand geteilt via periodStore. */
export function PeriodSwitcher() {
  const type = usePeriodStore((s) => s.type);
  const anchorIso = usePeriodStore((s) => s.anchorIso);
  const setType = usePeriodStore((s) => s.setType);
  const setAnchorIso = usePeriodStore((s) => s.setAnchorIso);

  const anchor = new Date(`${anchorIso}T00:00:00`);
  const range = getPeriodRange(type, anchor);

  function shift(dir: 1 | -1) {
    setAnchorIso(shiftPeriod(type, anchor, dir).toISOString().slice(0, 10));
  }

  return (
    <div className="flex items-center gap-2" aria-label="Zeitraum-Navigation">
      <div role="radiogroup" className="inline-flex rounded-klein border border-border">
        {(Object.keys(TYPE_LABELS) as PeriodType[]).map((t, i) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              i > 0 && "border-l border-border",
              type === t ? "bg-petrol text-card" : "text-charcoal hover:bg-accent",
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <Button size="icon" variant="ghost" aria-label="Vorheriger Zeitraum" onClick={() => shift(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[130px] text-center text-sm font-medium text-charcoal" aria-live="polite">
        {range.label}
      </span>
      <Button size="icon" variant="ghost" aria-label="Nächster Zeitraum" onClick={() => shift(1)}>
        <ChevronRight className="size-4" />
      </Button>
      <button
        type="button"
        className="text-xs text-petrol underline"
        onClick={() => setAnchorIso(new Date().toISOString().slice(0, 10))}
      >
        Aktueller Zeitraum
      </button>
    </div>
  );
}
