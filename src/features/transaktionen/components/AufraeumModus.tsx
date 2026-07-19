import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CategorySelect } from "@/components/CategorySelect";
import { useCategories } from "@/hooks/useCategories";
import { listTransactions, updateTransaction, type TransactionWithTags } from "@/db/repositories/transactions";
import { createRule } from "@/db/repositories/rules";
import { formatEur } from "@/lib/money";

interface AufraeumModusProps {
  open: boolean;
  dateFrom: string;
  dateTo: string;
  assetId?: number | null;
  personId?: number | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function AufraeumModus({ open, dateFrom, dateTo, assetId, personId, onOpenChange, onDone }: AufraeumModusProps) {
  const { data: categories } = useCategories();
  const [items, setItems] = useState<TransactionWithTags[]>([]);
  const [index, setIndex] = useState(0);
  const [recentCategoryIds, setRecentCategoryIds] = useState<number[]>([]);
  const [categorizedCount, setCategorizedCount] = useState(0);
  const [rulesCreatedCount, setRulesCreatedCount] = useState(0);
  const [ruleSuggestion, setRuleSuggestion] = useState<{ counterparty: string; count: number; categoryId: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setFinished(false);
    setIndex(0);
    setCategorizedCount(0);
    setRulesCreatedCount(0);
    listTransactions({
      assetId,
      personId,
      dateFrom,
      dateTo,
      quickUnkategorisiert: true,
      sortBy: "booking_date",
      sortDir: "desc",
      limit: 500,
    }).then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, [open, dateFrom, dateTo, assetId, personId]);

  const current = items[index];

  const occurrenceCount = useMemo(() => {
    if (!current) return 0;
    const key = normalize(current.counterparty);
    return items.filter((i) => normalize(i.counterparty) === key).length;
  }, [items, current]);

  async function advance() {
    if (index + 1 >= items.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
    setRuleSuggestion(null);
  }

  async function handleCategorize(categoryId: number) {
    if (!current) return;
    await updateTransaction(current.id, { category_id: categoryId, categorization_source: "manual" });
    setCategorizedCount((c) => c + 1);
    setRecentCategoryIds((prev) => [categoryId, ...prev.filter((id) => id !== categoryId)].slice(0, 6));

    if (occurrenceCount >= 2) {
      setRuleSuggestion({ counterparty: current.counterparty, count: occurrenceCount, categoryId });
      return;
    }
    await advance();
  }

  async function handleCreateRuleAndApply() {
    if (!ruleSuggestion || !current) return;
    await createRule(
      [{ field: "counterparty", operator: "contains", value: ruleSuggestion.counterparty }],
      {
        category_id: ruleSuggestion.categoryId,
        tag_id: null,
        mark_as_transfer: false,
        mark_as_saving: false,
        sparzweck_id: null,
      },
    );
    setRulesCreatedCount((c) => c + 1);
    // Wendet die Regel sofort auf passende unkategorisierte Zeilen im Stapel an und überspringt sie.
    const key = normalize(ruleSuggestion.counterparty);
    const matchingIds = new Set(
      items.filter((i) => normalize(i.counterparty).includes(key) && !i.category_id).map((i) => i.id),
    );
    for (const id of matchingIds) {
      if (id === current.id) continue;
      await updateTransaction(id, { category_id: ruleSuggestion.categoryId, categorization_source: "rule" });
      setCategorizedCount((c) => c + 1);
    }
    setItems((prev) => prev.filter((i) => !matchingIds.has(i.id) || i.id === current.id));
    await advance();
  }

  function handleClose() {
    onDone();
    onOpenChange(false);
  }

  const recentCategories = (categories ?? []).filter((c) => recentCategoryIds.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[90vw] max-w-[900px] flex-col p-0">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex-1">
            <p className="text-sm text-charcoal">
              {Math.min(index + 1, items.length)} von {items.length}
            </p>
            <Progress value={items.length ? ((index + 1) / items.length) * 100 : 0} className="mt-1 h-1.5" />
          </div>
          <div className="ml-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void advance()} disabled={finished}>
              Überspringen
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Beenden
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading && <p className="text-sm text-slate">Lädt…</p>}

          {!loading && (finished || items.length === 0) && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <h2 className="font-heading text-xl text-charcoal">Alles aufgeräumt 🎉</h2>
              <p className="text-sm text-slate">
                {categorizedCount} kategorisiert, {rulesCreatedCount} Regeln erstellt.
              </p>
              <Button className="mt-4" onClick={handleClose}>
                Fertig
              </Button>
            </div>
          )}

          {!loading && !finished && current && (
            <div className="mx-auto max-w-lg space-y-5">
              <div className="text-center">
                <p className="text-xs text-slate">{current.booking_date}</p>
                <h2 className="font-heading text-2xl text-charcoal">{current.counterparty}</h2>
                {current.purpose && <p className="mt-1 text-sm text-slate">{current.purpose}</p>}
                <p className="num mt-2 text-xl text-charcoal">{formatEur(current.amount_cents)}</p>
              </div>

              {recentCategories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {recentCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void handleCategorize(c.id)}
                      className="rounded-pill border border-border px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <CategorySelect value={null} onChange={(id) => id !== null && void handleCategorize(id)} allowNone={false} />

              {ruleSuggestion && (
                <div className="rounded-klein bg-accent p-3 text-sm">
                  <p>
                    "{ruleSuggestion.counterparty}" kommt {ruleSuggestion.count}× vor. Regel erstellen: Empfänger enthält
                    "{ruleSuggestion.counterparty}" → {categories?.find((c) => c.id === ruleSuggestion.categoryId)?.name}?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => void handleCreateRuleAndApply()}>
                      Regel erstellen & anwenden
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void advance()}>
                      Nur diese
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
