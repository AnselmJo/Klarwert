import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, Trash2, Plus, ChevronDown } from "lucide-react";
import { CategorySelect } from "@/components/CategorySelect";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTags } from "@/hooks/useTags";
import { useSparzwecke } from "@/hooks/useSparzwecke";
import { createTag } from "@/db/repositories/tags";
import {
  deleteManualTransaction,
  setTransactionTags,
  updateTransaction,
  type TransactionWithTags,
} from "@/db/repositories/transactions";
import { formatEur, parseAmountToCents } from "@/lib/money";
import { todayIso } from "@/lib/dates";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const EXTRA_FIELD_LABELS: Record<string, string> = {
  transaction_type: "Transaktionstyp",
  card_payment_at: "Karteneinsatz-Zeitpunkt",
  cash_withdrawal_at: "Bargeldabhebung-Zeitpunkt",
  recipient_iban: "Empfänger-IBAN",
  recipient_bic: "Empfänger-BIC",
  recipient_account_number: "Empfänger-Kontonummer",
  description: "Beschreibung",
  bank_category: "Bank-Kategorie",
  bank_subcategory: "Bank-Unterkategorie",
  bank_account_label: "Kontoname (Bank)",
};

const NEW_TAG_COLORS = ["#4a6fa5", "#b79a5b", "#c07a4a", "#6b7a80", "#6f9a6d"];

interface TransactionDrawerProps {
  transaction: TransactionWithTags | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function TransactionDrawer({ transaction, onOpenChange, onSaved }: TransactionDrawerProps) {
  const queryClient = useQueryClient();
  const { data: tags } = useTags();
  const { data: sparzwecke } = useSparzwecke();
  const [newTagName, setNewTagName] = useState("");

  const [bookingDate, setBookingDate] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sparzweckId, setSparzweckId] = useState<number | null>(null);
  const [isReviewed, setIsReviewed] = useState(true);
  const [isTransfer, setIsTransfer] = useState(false);
  const [excludeFromStats, setExcludeFromStats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setBookingDate(transaction.booking_date);
      setCounterparty(transaction.counterparty);
      setPurpose(transaction.purpose ?? "");
      setAmount((transaction.amount_cents / 100).toFixed(2).replace(".", ","));
      setCategoryId(transaction.category_id);
      setTagIds(transaction.tag_ids);
      setIsSaving(!!transaction.is_saving);
      setSparzweckId(transaction.sparzweck_id);
      setIsReviewed(!!transaction.is_reviewed);
      setIsTransfer(!!transaction.is_transfer);
      setExcludeFromStats(!!transaction.exclude_from_stats);
    }
  }, [transaction]);

  if (!transaction) return null;
  const isImported = transaction.source === "import";

  let extraFields: Record<string, string> = {};
  if (transaction.extra_fields_json) {
    try {
      extraFields = JSON.parse(transaction.extra_fields_json);
    } catch {
      extraFields = {};
    }
  }
  const extraFieldEntries = Object.entries(extraFields).filter(([, v]) => v);

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const color = NEW_TAG_COLORS[Math.floor(Math.random() * NEW_TAG_COLORS.length)];
    const id = await createTag(newTagName.trim(), color);
    setTagIds((prev) => [...prev, id]);
    setNewTagName("");
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  }

  async function handleSave() {
    if (!transaction) return;
    setSubmitting(true);
    try {
      const isManual = transaction.source === "manual";
      await updateTransaction(transaction.id, {
        category_id: categoryId,
        categorization_source: categoryId ? "manual" : "none",
        is_saving: isSaving ? 1 : 0,
        sparzweck_id: isSaving ? sparzweckId : null,
        is_reviewed: isReviewed ? 1 : 0,
        is_transfer: isTransfer ? 1 : 0,
        exclude_from_stats: excludeFromStats ? 1 : 0,
        ...(isManual
          ? {
              booking_date: bookingDate,
              counterparty: counterparty.trim(),
              purpose: purpose.trim() || null,
              amount_cents: parseAmountToCents(amount),
            }
          : {}),
      });
      await setTransactionTags(transaction.id, tagIds);
      toast.success("Änderungen gespeichert");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Fehler: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    await deleteManualTransaction(transaction.id);
    toast.success("Transaktion gelöscht");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Sheet open={!!transaction} onOpenChange={onOpenChange}>
      <SheetContent className="w-[390px] overflow-y-auto sm:max-w-[390px]">
        <SheetHeader>
          <SheetTitle>Transaktion</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {isImported && (
            <div className="flex items-center gap-1.5 rounded-klein bg-accent px-3 py-2 text-xs text-slate">
              <Lock className="size-3.5" />
              Importierte Daten – Korrektur über neuen Import
            </div>
          )}

          {isImported ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium text-charcoal">{transaction.counterparty}</div>
              {transaction.purpose && <div className="text-slate">{transaction.purpose}</div>}
              <div className="flex items-center gap-2 text-xs text-slate">
                <span>{transaction.booking_date}</span>
                <span className="num text-sm text-charcoal">{formatEur(transaction.amount_cents)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tx-date">Datum</Label>
                  <Input
                    id="tx-date"
                    type="date"
                    max={todayIso()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tx-amount">Betrag</Label>
                  <Input id="tx-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tx-counterparty">Empfänger</Label>
                <Input id="tx-counterparty" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tx-purpose">Zweck</Label>
                <Input id="tx-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <CategorySelect value={categoryId} onChange={setCategoryId} />
            <p className="text-xs text-slate">
              Herkunft: {transaction.categorization_source === "manual" ? "manuell" : "keine"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            {tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setTagIds((prev) =>
                          active ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                        )
                      }
                      className="rounded-pill border px-2.5 py-1 text-xs"
                      style={{
                        borderColor: t.color,
                        backgroundColor: active ? t.color : "transparent",
                        color: active ? "#fffdf8" : t.color,
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate">Keine Tags vorhanden.</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Neuer Tag…"
                maxLength={30}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreateTag();
                  }
                }}
              />
              <Button size="sm" variant="ghost" onClick={() => void handleCreateTag()} disabled={!newTagName.trim()}>
                <Plus className="mr-1 size-3.5" />
                Anlegen
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tx-saving">Sparen</Label>
            <Switch id="tx-saving" checked={isSaving} onCheckedChange={setIsSaving} />
          </div>
          {isSaving && (
            <Select
              value={sparzweckId ? String(sparzweckId) : "none"}
              onValueChange={(v) => setSparzweckId(v === "none" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="flex items-center justify-between">
            <Label htmlFor="tx-reviewed">Geprüft</Label>
            <Switch id="tx-reviewed" checked={isReviewed} onCheckedChange={setIsReviewed} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tx-transfer">Transfer</Label>
            <Switch id="tx-transfer" checked={isTransfer} onCheckedChange={setIsTransfer} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tx-exclude">Aus Statistik entfernt</Label>
            <Switch id="tx-exclude" checked={excludeFromStats} onCheckedChange={setExcludeFromStats} />
          </div>

          {transaction.is_transfer === 1 && (
            <Badge className="bg-sage text-card hover:bg-sage">Transfer</Badge>
          )}

          {extraFieldEntries.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-petrol">
                <ChevronDown className="size-4" />
                Weitere Bankdaten
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1.5">
                {extraFieldEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 text-xs">
                    <span className="text-slate">{EXTRA_FIELD_LABELS[key] ?? key}</span>
                    <span className="text-right text-charcoal">{value}</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <SheetFooter className="mt-6 flex-row justify-between sm:justify-between">
          {transaction.source === "manual" ? (
            <Button variant="ghost" className="text-brick" onClick={() => void handleDelete()}>
              <Trash2 className="mr-1.5 size-4" />
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <Button
            onClick={() => void handleSave()}
            disabled={submitting || (!isImported && (!counterparty.trim() || !amount.trim()))}
          >
            Speichern
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
