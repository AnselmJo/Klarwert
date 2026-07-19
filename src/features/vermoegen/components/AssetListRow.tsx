import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/Sparkline";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { AssetWithOwners } from "@/db/repositories/assets";
import type { Person } from "@/db/types";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  giro: "Girokonto",
  tagesgeld: "Tagesgeld",
  kreditkarte: "Kreditkarte",
  depot: "Depot",
  darlehen: "Darlehen",
};

const VALUABLE_TYPE_LABELS: Record<string, string> = {
  bausparvertrag: "Bausparvertrag",
  bargeld: "Bargeld",
  sonstiges: "Sonstiges",
};

interface AssetListRowProps {
  asset: AssetWithOwners;
  balanceCents: number;
  sparklineValues: number[];
  persons: Person[];
  isStale: boolean;
  hasAnchor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateValue: () => void;
  onNewImport: () => void;
}

export function AssetListRow({
  asset,
  balanceCents,
  sparklineValues,
  persons,
  isStale,
  hasAnchor,
  onEdit,
  onDelete,
  onUpdateValue,
  onNewImport,
}: AssetListRowProps) {
  const typeLabel =
    asset.kind === "account"
      ? ACCOUNT_TYPE_LABELS[asset.account_type ?? ""]
      : VALUABLE_TYPE_LABELS[asset.valuable_type ?? ""];
  const ownerNames = persons
    .filter((p) => asset.owner_ids.includes(p.id))
    .map((p) => p.name)
    .join(", ");

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-klein border border-transparent px-3 py-3",
        isStale && "border-gold/60 bg-gold/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-charcoal">{asset.name}</span>
          <Badge variant="outline" className="shrink-0 text-xs font-normal">
            {typeLabel}
          </Badge>
          {asset.kind === "account" && !hasAnchor && (
            <Badge className="shrink-0 bg-gold text-charcoal hover:bg-gold">
              Saldo unbestätigt
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-slate">
          {ownerNames || "Kein Owner"}
          {asset.kind === "account" && (
            <>
              {" · "}
              {asset.last_import_at
                ? `letzter Import ${asset.last_import_at.slice(0, 10)}`
                : "noch nicht importiert"}
            </>
          )}
        </div>
      </div>

      {asset.kind === "account" && <Sparkline values={sparklineValues} />}

      <div className="num w-28 shrink-0 text-right text-sm text-charcoal">
        {formatEur(balanceCents)}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {asset.kind === "account" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onNewImport}
            className={isStale ? "text-gold" : undefined}
          >
            {isStale && <TriangleAlert className="mr-1 size-3.5" />}
            Import
          </Button>
        )}
        {asset.kind === "valuable" && (
          <Button size="sm" variant="ghost" onClick={onUpdateValue}>
            Wert aktualisieren
          </Button>
        )}
        <Button size="icon" variant="ghost" aria-label="Bearbeiten" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Löschen" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
