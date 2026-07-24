import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { useGlobalFilterStore } from "@/stores/globalFilterStore";
import { usePeriodStore } from "@/stores/periodStore";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listBudgets, type BudgetSummary } from "@/db/repositories/budgets";
import { BudgetEditorModal } from "@/features/budgets/BudgetEditorModal";

const PERIOD_LABELS: Record<BudgetSummary["period_type"], string> = {
  week: "Woche",
  month: "Monat",
  quarter: "Quartal",
  year: "Jahr",
};

function usageTone(usage: number): "sage" | "gold" | "brick" {
  if (usage >= 1) return "brick";
  if (usage >= 0.8) return "gold";
  return "sage";
}

function toneClasses(tone: "sage" | "gold" | "brick") {
  return {
    sage: "bg-sage text-card",
    gold: "bg-gold text-card",
    brick: "bg-brick text-card",
  }[tone];
}

function BudgetCard({ budget, onClick }: { budget: BudgetSummary; onClick: () => void }) {
  const tone = usageTone(budget.usage);
  const usagePercent = Math.round(budget.usage * 100);
  const maxHistory = Math.max(...budget.history.map((point) => point.limitCents), 1);

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-standard border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: budget.categoryColor }}
            />
            <h2 className="truncate text-sm font-semibold text-charcoal">
              {budget.parentName ? `${budget.parentName} · ` : ""}
              {budget.categoryName}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate">
            {PERIOD_LABELS[budget.period_type]} · {budget.periodLabel}
          </p>
        </div>
        <Badge className={cn("shrink-0", toneClasses(tone))}>{usagePercent} %</Badge>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="num text-lg font-semibold text-charcoal">
            {formatEur(budget.spentCents)}
          </span>
          <span className="num text-sm text-slate">von {formatEur(budget.limit_cents)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper">
          <div
            className={cn("h-full rounded-full", toneClasses(tone))}
            style={{ width: `${Math.min(100, budget.usage * 100)}%` }}
          />
        </div>
        <div className={cn("mt-2 text-xs", budget.remainingCents >= 0 ? "text-slate" : "text-brick")}>
          {budget.remainingCents >= 0
            ? `${formatEur(budget.remainingCents)} verbleibend`
            : `${formatEur(Math.abs(budget.remainingCents))} überschritten`}
        </div>
      </div>

      <div className="mt-4 flex h-12 items-end gap-1" aria-label="Mini-Verlauf der letzten 6 Perioden">
        {budget.history.map((point) => {
          const height = Math.max(4, Math.min(48, (point.spentCents / maxHistory) * 48));
          const pointTone = usageTone(point.limitCents > 0 ? point.spentCents / point.limitCents : 0);
          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn("w-full rounded-t-sm", toneClasses(pointTone))}
                style={{ height }}
                title={`${point.label}: ${formatEur(point.spentCents)}`}
              />
            </div>
          );
        })}
      </div>
    </button>
  );
}

export function BudgetsPage() {
  const queryClient = useQueryClient();
  const selectedAccountId = useGlobalFilterStore((s) => s.selectedAccountId);
  const selectedPersonId = useGlobalFilterStore((s) => s.selectedPersonId);
  const anchorIso = usePeriodStore((s) => s.anchorIso);
  const { data: categories } = useCategories();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetSummary | null>(null);

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets", anchorIso, selectedAccountId, selectedPersonId],
    queryFn: () =>
      listBudgets(anchorIso, {
        assetId: selectedAccountId,
        personId: selectedPersonId,
      }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-category-expenses"] });
  }

  const unbudgeted = useMemo(() => {
    const budgeted = new Set((budgets ?? []).map((budget) => budget.category_id));
    return (categories ?? [])
      .filter((category) => category.direction === "ausgabe" && category.is_system === 0)
      .filter((category) => {
        if (budgeted.has(category.id)) return false;
        if (category.parent_id && budgeted.has(category.parent_id)) return false;
        const hasBudgetedChild = (categories ?? []).some(
          (child) => child.parent_id === category.id && budgeted.has(child.id),
        );
        return !hasBudgetedChild;
      })
      .slice(0, 8);
  }, [budgets, categories]);

  const overLimitCount = (budgets ?? []).filter((budget) => budget.usage >= 1).length;
  const warningCount = (budgets ?? []).filter((budget) => budget.usage >= 0.8 && budget.usage < 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl text-charcoal">Budgets</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate">
            <span>{budgets?.length ?? 0} Budgets</span>
            <span aria-hidden="true">·</span>
            <span>{warningCount} nahe am Limit</span>
            <span aria-hidden="true">·</span>
            <span>{overLimitCount} überschritten</span>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="size-4" />
          Budget
        </Button>
      </div>

      {overLimitCount > 0 && (
        <div className="flex items-center gap-2 rounded-klein border border-brick/20 bg-brick/10 px-3 py-2 text-sm text-brick">
          <AlertTriangle className="size-4" />
          {overLimitCount} Budget{overLimitCount === 1 ? "" : "s"} über dem Limit.
        </div>
      )}

      {isLoading && <p className="text-sm text-slate">Budgets werden geladen…</p>}

      {!isLoading && budgets && budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onClick={() => {
                setEditing(budget);
                setEditorOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && (!budgets || budgets.length === 0) && (
        <div className="rounded-standard border border-border bg-card p-8 text-center">
          <Target className="mx-auto size-8 text-petrol" />
          <h2 className="mt-3 font-heading text-lg text-charcoal">Noch keine Budgets</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate">
            Lege ein Limit je Kategorie fest, um Verbrauch, Restbetrag und Verlauf im Blick zu behalten.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="size-4" />
            Budget anlegen
          </Button>
        </div>
      )}

      <section className="rounded-standard border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-charcoal">Kategorien ohne Budget</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            Budget ergänzen
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {unbudgeted.map((category) => {
            const parent = category.parent_id
              ? categories?.find((candidate) => candidate.id === category.parent_id)
              : null;
            return (
              <span
                key={category.id}
                className="rounded-klein bg-paper px-2.5 py-1 text-xs text-slate"
              >
                {parent ? `${parent.name} · ` : ""}
                {category.name}
              </span>
            );
          })}
          {unbudgeted.length === 0 && (
            <p className="text-sm text-slate">Alle sichtbaren Ausgabenkategorien sind abgedeckt.</p>
          )}
        </div>
      </section>

      <BudgetEditorModal
        open={editorOpen}
        budget={editing}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={invalidate}
      />
    </div>
  );
}
