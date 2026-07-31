import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCategorizationLogForTransaction } from "@/db/repositories/merchants";

interface TransferSuggestionPopoverProps {
  transactionId: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** "Transfer?"-Badge mit Bestätigen/Trennen-Popover, zeigt zusätzlich die Erkennungsstufe (Transparenz). */
export function TransferSuggestionPopover({ transactionId, onConfirm, onDismiss }: TransferSuggestionPopoverProps) {
  const { data: log } = useQuery({
    queryKey: ["categorization-log", transactionId],
    queryFn: () => getCategorizationLogForTransaction(transactionId),
  });

  // Konfidenz-Konvention (pipeline.ts): 1.0 = Stufe 1 IBAN-Vollmatch, 0.9 = Stufe 2 Gegenbuchungsmatch.
  const detectionLabel =
    log?.matched_by === "transfer"
      ? log.confidence >= 1.0
        ? "Erkannt über IBAN"
        : "Erkannt über Betragsmuster"
      : "Als Transfer-Paar erkannt.";

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button type="button">
          <Badge className="bg-gold text-charcoal hover:bg-gold">Transfer?</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 space-y-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-slate">{detectionLabel}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm}>
            Bestätigen
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Trennen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
