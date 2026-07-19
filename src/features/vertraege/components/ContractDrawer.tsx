import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { formatEur } from "@/lib/money";
import { getRecentTransactionsForContract, updateContractCategory, updateContractStatus } from "@/db/repositories/contracts";
import type { Contract, ContractStatus } from "@/db/types";

interface ContractDrawerProps {
  contract: Contract | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  detected: "Neu erkannt",
  confirmed: "Bestätigt",
  price_changed: "Preisänderung erkannt",
  paused: "Pausiert",
  ended: "Beendet",
};

export function ContractDrawer({ contract, onOpenChange, onChanged }: ContractDrawerProps) {
  const queryClient = useQueryClient();
  const { data: recent } = useQuery({
    queryKey: ["contract-transactions", contract?.id],
    queryFn: () => getRecentTransactionsForContract(contract!.id),
    enabled: !!contract,
  });

  if (!contract) return null;

  async function handleStatusChange(status: ContractStatus) {
    if (!contract) return;
    await updateContractStatus(contract.id, status);
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    onChanged();
  }

  async function handleCategoryChange(categoryId: number | null) {
    if (!contract) return;
    await updateContractCategory(contract.id, categoryId);
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    onChanged();
  }

  return (
    <Sheet open={!!contract} onOpenChange={onOpenChange}>
      <SheetContent className="w-[390px] overflow-y-auto sm:max-w-[390px]">
        <SheetHeader>
          <SheetTitle>{contract.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate">Betrag</span>
            <span className="num text-charcoal">{formatEur(contract.current_amount_cents)}</span>
          </div>
          {contract.previous_amount_cents !== null && (
            <div className="flex justify-between text-xs text-gold">
              <span>Vorheriger Betrag</span>
              <span className="num">{formatEur(contract.previous_amount_cents)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={contract.status} onValueChange={(v) => void handleStatusChange(v as ContractStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as ContractStatus[])
                  .filter((s) => s !== "detected")
                  .map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <CategorySelect value={contract.category_id} onChange={(v) => void handleCategoryChange(v)} />
          </div>

          <div>
            <Label>Letzte Buchungen</Label>
            <div className="mt-2 space-y-1">
              {recent?.map((tx) => (
                <div key={tx.id} className="flex justify-between text-xs">
                  <span className="text-slate">{tx.booking_date}</span>
                  <span className="num text-charcoal">{formatEur(tx.amount_cents)}</span>
                </div>
              ))}
              {(!recent || recent.length === 0) && <p className="text-xs text-slate">Keine Buchungen.</p>}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
