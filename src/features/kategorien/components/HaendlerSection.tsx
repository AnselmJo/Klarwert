import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Lock, Plus, Pencil, Trash2, Store, X, Search, Share2, RefreshCw } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import {
  listMerchants,
  listMerchantAliases,
  listMerchantSuppressions,
  deleteMerchant,
  addMerchantAlias,
  removeMerchantAlias,
  suppressMerchant,
  unsuppressMerchant,
} from "@/db/repositories/merchants";
import { MerchantEditorModal } from "@/features/kategorien/components/MerchantEditorModal";
import { ShareSuggestionsDialog } from "@/features/kategorien/components/ShareSuggestionsDialog";
import { MerchantUpdateCheckDialog } from "@/features/kategorien/components/MerchantUpdateCheckDialog";
import type { Merchant } from "@/db/types";
import { toast } from "sonner";

/** Kategorien → Abschnitt Händler-Datenbank (Product Spec 4.6, Component Library B14/B15). */
export function HaendlerSection() {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: merchants } = useQuery({ queryKey: ["merchants"], queryFn: listMerchants });
  const { data: aliases } = useQuery({ queryKey: ["merchant-aliases"], queryFn: () => listMerchantAliases() });
  const { data: suppressions } = useQuery({ queryKey: ["merchant-suppressions"], queryFn: listMerchantSuppressions });

  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [newAliasByMerchant, setNewAliasByMerchant] = useState<Record<number, string>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const [updateCheckOpen, setUpdateCheckOpen] = useState(false);

  const suppressedIds = useMemo(() => new Set((suppressions ?? []).map((s) => s.merchant_id)), [suppressions]);
  const aliasesByMerchant = useMemo(() => {
    const map = new Map<number, typeof aliases>();
    for (const a of aliases ?? []) {
      const list = map.get(a.merchant_id) ?? [];
      list.push(a);
      map.set(a.merchant_id, list as any);
    }
    return map;
  }, [aliases]);

  function categoryName(id: number | null): string {
    if (!id) return "keine Standardkategorie";
    return categories?.find((c) => c.id === id)?.name ?? "?";
  }

  const filtered = (merchants ?? []).filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    if (m.display_name.toLowerCase().includes(q)) return true;
    const list = aliasesByMerchant.get(m.id) ?? [];
    return list.some((a: any) => a.match_value.toLowerCase().includes(q));
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["merchants"] });
    queryClient.invalidateQueries({ queryKey: ["merchant-aliases"] });
    queryClient.invalidateQueries({ queryKey: ["merchant-suppressions"] });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMerchant(deleteTarget.id);
    toast.success(`"${deleteTarget.display_name}" gelöscht`);
    setDeleteTarget(null);
    invalidate();
  }

  async function handleAddAlias(merchantId: number) {
    const value = (newAliasByMerchant[merchantId] ?? "").trim();
    if (!value) return;
    await addMerchantAlias({ merchant_id: merchantId, match_type: "name_exact", match_value: value });
    setNewAliasByMerchant((prev) => ({ ...prev, [merchantId]: "" }));
    invalidate();
  }

  async function handleToggleSuppress(merchant: Merchant, suppress: boolean) {
    if (suppress) {
      await suppressMerchant(merchant.id);
      toast.success(`"${merchant.display_name}" wird bei dir nicht mehr automatisch zugeordnet.`);
    } else {
      await unsuppressMerchant(merchant.id);
      toast.success(`Unterdrückung für "${merchant.display_name}" aufgehoben.`);
    }
    invalidate();
  }

  const hasAnyAutomaticCategorization = (merchants ?? []).length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg text-charcoal">Händler-Datenbank</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShareOpen(true)} disabled={!hasAnyAutomaticCategorization}>
            <Share2 className="mr-1 size-4" />
            Vorschläge teilen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setUpdateCheckOpen(true)} disabled={!hasAnyAutomaticCategorization}>
            <RefreshCw className="mr-1 size-4" />
            Regel-Update prüfen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" />
            Händler
          </Button>
        </div>
      </div>

      {!hasAnyAutomaticCategorization ? (
        <p className="rounded-standard border border-border bg-card p-3 text-sm text-slate">
          Noch keine Händler vorhanden – die Händler-Datenbank füllt sich, sobald automatische Kategorisierungen
          stattgefunden haben oder du selbst Händler anlegst.
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Händler oder Alias suchen…"
              className="h-8 pl-8 text-sm"
            />
          </div>

          <div role="table" className="rounded-standard border border-border bg-card">
            {filtered.map((m) => {
              const isSuppressed = suppressedIds.has(m.id);
              const rowAliases = (aliasesByMerchant.get(m.id) ?? []) as any[];
              const isOwn = m.is_builtin === 0;
              return (
                <div key={m.id} role="row" className="flex flex-wrap items-start gap-3 border-b border-border p-2.5 last:border-0">
                  <Store className="mt-1 size-4 shrink-0 text-slate" />
                  <div className="min-w-[140px] flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal">{m.display_name}</span>
                      <Badge variant="outline" className={isOwn ? "border-sage text-sage" : "text-slate"}>
                        {isOwn ? "eigen" : isSuppressed ? "kuratiert, lokal unterdrückt" : "kuratiert"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate">
                      {!isOwn && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="size-3" aria-label="Kuratiert, nicht direkt editierbar" />
                          </TooltipTrigger>
                          <TooltipContent>kuratiert – zum Abweichen lokal unterdrücken</TooltipContent>
                        </Tooltip>
                      )}
                      <span className={isSuppressed ? "line-through" : ""}>{categoryName(m.default_category_id)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {rowAliases.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1 rounded-pill border border-border px-2 py-0.5 text-[11px] text-slate"
                        >
                          {a.match_value}
                          {isOwn && (
                            <button
                              type="button"
                              aria-label={`Alias ${a.match_value} entfernen`}
                              onClick={async () => {
                                await removeMerchantAlias(a.id);
                                invalidate();
                              }}
                            >
                              <X className="size-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                      {isOwn && (
                        <span className="inline-flex items-center gap-1">
                          <Input
                            value={newAliasByMerchant[m.id] ?? ""}
                            onChange={(e) => setNewAliasByMerchant((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleAddAlias(m.id);
                              }
                            }}
                            placeholder="+ Alias"
                            className="h-6 w-24 text-[11px]"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isOwn ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Bearbeiten"
                          onClick={() => {
                            setEditing(m);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Löschen" onClick={() => setDeleteTarget(m)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void handleToggleSuppress(m, !isSuppressed)}>
                        {isSuppressed ? "Unterdrückung aufheben" : "Unterdrücken"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="p-3 text-sm text-slate">Keine Treffer.</p>}
          </div>
        </>
      )}

      <MerchantEditorModal open={editorOpen} merchant={editing} onOpenChange={setEditorOpen} onSaved={invalidate} />
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={`"${deleteTarget.display_name}" löschen?`}
          description="Entfernt diesen eigenen Händler samt Aliasen. Bereits kategorisierte Transaktionen bleiben unverändert."
          confirmLabel="Löschen"
          onConfirm={() => void handleDelete()}
        />
      )}
      <ShareSuggestionsDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        ownMerchants={(merchants ?? []).filter((m) => m.is_builtin === 0)}
        categories={categories ?? []}
      />
      <MerchantUpdateCheckDialog
        open={updateCheckOpen}
        onOpenChange={setUpdateCheckOpen}
        currentMerchants={merchants ?? []}
        categories={categories ?? []}
        onApplied={invalidate}
      />
    </div>
  );
}
