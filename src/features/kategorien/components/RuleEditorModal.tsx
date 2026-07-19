import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { Plus, Trash2 } from "lucide-react";
import { useTags } from "@/hooks/useTags";
import { useSparzwecke } from "@/hooks/useSparzwecke";
import { useAssets } from "@/hooks/useAssets";
import {
  createRule,
  updateRule,
  countRuleMatches,
  type RuleConditionInput,
  type RuleWithConditions,
} from "@/db/repositories/rules";
import type { RuleField, RuleOperator } from "@/db/types";
import { toast } from "sonner";

const FIELD_LABELS: Record<RuleField, string> = {
  purpose: "Verwendungszweck",
  counterparty: "Empfänger",
  amount: "Betrag",
  asset: "Konto",
};
const OPERATOR_LABELS: Record<RuleOperator, string> = {
  contains: "enthält",
  equals: "ist genau",
  approx: "≈ ±5 %",
};

interface RuleEditorModalProps {
  open: boolean;
  rule: RuleWithConditions | null;
  defaultCategoryId?: number | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function RuleEditorModal({ open, rule, defaultCategoryId, onOpenChange, onSaved }: RuleEditorModalProps) {
  const [conditions, setConditions] = useState<RuleConditionInput[]>([
    { field: "counterparty", operator: "contains", value: "" },
  ]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);
  const [markAsTransfer, setMarkAsTransfer] = useState(false);
  const [markAsSaving, setMarkAsSaving] = useState(false);
  const [sparzweckId, setSparzweckId] = useState<number | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: tags } = useTags();
  const { data: sparzwecke } = useSparzwecke();
  const { data: assets } = useAssets(false);

  useEffect(() => {
    if (!open) return;
    if (rule) {
      setConditions(rule.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value })));
      setCategoryId(rule.category_id);
      setTagId(rule.tag_id);
      setMarkAsTransfer(!!rule.mark_as_transfer);
      setMarkAsSaving(!!rule.mark_as_saving);
      setSparzweckId(rule.sparzweck_id);
    } else {
      setConditions([{ field: "counterparty", operator: "contains", value: "" }]);
      setCategoryId(defaultCategoryId ?? null);
      setTagId(null);
      setMarkAsTransfer(false);
      setMarkAsSaving(false);
      setSparzweckId(null);
    }
  }, [open, rule, defaultCategoryId]);

  useEffect(() => {
    if (!open) return;
    const validConditions = conditions.filter((c) => c.value.trim());
    if (validConditions.length === 0) {
      setMatchCount(null);
      return;
    }
    const timeout = setTimeout(() => {
      countRuleMatches(validConditions).then(setMatchCount);
    }, 300);
    return () => clearTimeout(timeout);
  }, [conditions, open]);

  const hasCompleteCondition = conditions.some((c) => c.value.trim());
  const hasAction = !!categoryId || !!tagId || markAsTransfer || markAsSaving;

  async function handleSubmit() {
    const validConditions = conditions.filter((c) => c.value.trim());
    if (validConditions.length === 0 || !hasAction) return;
    setSubmitting(true);
    try {
      const actions = {
        category_id: categoryId,
        tag_id: tagId,
        mark_as_transfer: markAsTransfer,
        mark_as_saving: markAsSaving,
        sparzweck_id: markAsSaving ? sparzweckId : null,
      };
      if (rule) {
        await updateRule(rule.id, validConditions, actions);
      } else {
        await createRule(validConditions, actions);
      }
      toast.success(rule ? "Regel gespeichert" : "Regel angelegt");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Fehler: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  function updateCondition(idx: number, patch: Partial<RuleConditionInput>) {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{rule ? "Regel bearbeiten" : "Regel anlegen"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Bedingungen (alle müssen zutreffen)</Label>
            {conditions.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select value={c.field} onValueChange={(v) => updateCondition(idx, { field: v as RuleField })}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FIELD_LABELS) as RuleField[]).map((f) => (
                      <SelectItem key={f} value={f}>
                        {FIELD_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={c.operator}
                  onValueChange={(v) => updateCondition(idx, { operator: v as RuleOperator })}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(OPERATOR_LABELS) as RuleOperator[])
                      .filter((op) => op !== "approx" || c.field === "amount")
                      .map((op) => (
                        <SelectItem key={op} value={op}>
                          {OPERATOR_LABELS[op]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {c.field === "asset" ? (
                  <Select value={c.value} onValueChange={(v) => updateCondition(idx, { value: v })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Konto wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets?.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="flex-1"
                    value={c.value}
                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                    placeholder="Wert"
                  />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Bedingung entfernen"
                  onClick={() => setConditions((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={conditions.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConditions((prev) => [...prev, { field: "counterparty", operator: "contains", value: "" }])}
            >
              <Plus className="mr-1 size-4" />
              Bedingung
            </Button>
          </div>

          <div className="space-y-3 rounded-standard border border-border p-3">
            <Label>Aktionen (mindestens eine)</Label>
            <CategorySelect value={categoryId} onChange={setCategoryId} placeholder="Kategorie zuweisen" />
            <Select
              value={tagId ? String(tagId) : "none"}
              onValueChange={(v) => setTagId(v === "none" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tag zuweisen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Tag</SelectItem>
                {tags?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <Label htmlFor="rule-transfer">Als Transfer markieren</Label>
              <Switch id="rule-transfer" checked={markAsTransfer} onCheckedChange={setMarkAsTransfer} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rule-saving">Als Sparen markieren</Label>
              <Switch id="rule-saving" checked={markAsSaving} onCheckedChange={setMarkAsSaving} />
            </div>
            {markAsSaving && (
              <Select
                value={sparzweckId ? String(sparzweckId) : "none"}
                onValueChange={(v) => setSparzweckId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sparzweck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Sparzweck</SelectItem>
                  {sparzwecke?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {matchCount !== null && (
            <p className="text-sm text-slate">{matchCount} Transaktionen treffen aktuell zu.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !hasCompleteCondition || !hasAction}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
