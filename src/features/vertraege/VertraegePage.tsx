import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContracts, useRecurringPayments } from "@/hooks/useContracts";
import { ContractDrawer } from "@/features/vertraege/components/ContractDrawer";
import { dismissRecurringPayment, renameRecurringPayment, upgradeToContract } from "@/db/repositories/recurringPayments";
import { formatEur } from "@/lib/money";
import type { Contract, ContractStatus } from "@/db/types";
import { toast } from "sonner";

const STATUS_LABELS: Record<ContractStatus, string> = {
  detected: "Neu erkannt",
  confirmed: "Bestätigt",
  price_changed: "Preisänderung erkannt",
  paused: "Pausiert",
  ended: "Beendet",
};

const STATUS_ORDER: Record<ContractStatus, number> = {
  price_changed: 0,
  detected: 1,
  confirmed: 2,
  paused: 3,
  ended: 4,
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  detected: "bg-brick text-card hover:bg-brick",
  confirmed: "bg-sage text-card hover:bg-sage",
  price_changed: "bg-gold text-charcoal hover:bg-gold",
  paused: "bg-slate text-card hover:bg-slate",
  ended: "bg-slate text-card hover:bg-slate",
};

export function VertraegePage() {
  const queryClient = useQueryClient();
  const { data: contracts } = useContracts();
  const { data: recurringPayments } = useRecurringPayments();
  const [view, setView] = useState<"contracts" | "recurring">("contracts");
  const [search, setSearch] = useState("");
  const [drawerContract, setDrawerContract] = useState<Contract | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
  }

  const filteredContracts = useMemo(() => {
    const list = (contracts ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.current_amount_cents - a.current_amount_cents,
    );
  }, [contracts, search]);

  const filteredRecurring = useMemo(
    () => (recurringPayments ?? []).filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [recurringPayments, search],
  );

  const monthlyFixedCosts = (contracts ?? [])
    .filter((c) => c.status === "confirmed" || c.status === "price_changed")
    .reduce((sum, c) => sum + (c.interval === "yearly" ? c.current_amount_cents / 12 : c.current_amount_cents), 0);

  async function handleUpgrade(id: number) {
    await upgradeToContract(id, null);
    toast.success("Zu Vertrag hochgestuft");
    invalidate();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl text-charcoal">Verträge</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate">
          <span>{contracts?.length ?? 0} Verträge</span>
          <span aria-hidden="true">·</span>
          <span className="num">{formatEur(Math.round(monthlyFixedCosts))} feste Kosten/Monat</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" className="inline-flex rounded-klein border border-border">
          {(["contracts", "recurring"] as const).map((v, i) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm transition-colors ${i > 0 ? "border-l border-border" : ""} ${
                view === v ? "bg-petrol text-card" : "text-charcoal hover:bg-accent"
              }`}
            >
              {v === "contracts" ? "Verträge" : "Weitere wiederkehrende Zahlungen"}
            </button>
          ))}
        </div>
        <Input
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {view === "contracts" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setDrawerContract(c)}
              className="rounded-standard border border-border bg-card p-4 text-left hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal">{c.name}</span>
                <Badge className={STATUS_COLOR[c.status]}>{STATUS_LABELS[c.status]}</Badge>
              </div>
              <div className="num mt-2 text-lg text-charcoal">{formatEur(c.current_amount_cents)}</div>
              {c.previous_amount_cents !== null && (
                <div className="num text-xs text-gold">vorher {formatEur(c.previous_amount_cents)}</div>
              )}
            </button>
          ))}
          {filteredContracts.length === 0 && (
            <p className="col-span-full text-sm text-slate">Noch keine Verträge erkannt.</p>
          )}
        </div>
      )}

      {view === "recurring" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecurring.map((r) => (
            <div key={r.id} className="rounded-standard border border-border bg-card p-4">
              <Input
                defaultValue={r.name}
                className="mb-2 h-7 border-none px-0 text-sm font-medium"
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== r.name) {
                    void renameRecurringPayment(r.id, e.target.value.trim()).then(invalidate);
                  }
                }}
              />
              <div className="num text-lg text-charcoal">{formatEur(r.typical_amount_cents)}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void dismissRecurringPayment(r.id).then(invalidate)}
                >
                  Trennen
                </Button>
                <Button size="sm" onClick={() => void handleUpgrade(r.id)}>
                  Zu Vertrag hochstufen
                </Button>
              </div>
            </div>
          ))}
          {filteredRecurring.length === 0 && (
            <p className="col-span-full text-sm text-slate">Keine weiteren wiederkehrenden Zahlungen.</p>
          )}
        </div>
      )}

      <ContractDrawer contract={drawerContract} onOpenChange={(o) => !o && setDrawerContract(null)} onChanged={invalidate} />
    </div>
  );
}
