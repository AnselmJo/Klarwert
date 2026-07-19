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
import { addValueHistoryEntry } from "@/db/repositories/valueHistory";
import { parseAmountToCents } from "@/lib/money";
import { todayIso } from "@/lib/dates";
import type { AssetWithOwners } from "@/db/repositories/assets";
import { toast } from "sonner";

interface UpdateValueModalProps {
  asset: AssetWithOwners | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** 5.3 Wert aktualisieren (Wertgegenstand) – append-only neuer Historien-Eintrag. */
export function UpdateValueModal({ asset, onOpenChange, onSaved }: UpdateValueModalProps) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (asset) {
      setValue("");
      setDate(todayIso());
    }
  }, [asset]);

  if (!asset) return null;

  async function handleSubmit() {
    if (!asset || !value.trim()) return;
    setSubmitting(true);
    try {
      await addValueHistoryEntry({
        asset_id: asset.id,
        valued_at: date,
        value_cents: parseAmountToCents(value),
        source: "manual",
      });
      toast.success("Wert aktualisiert");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Fehler: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Wert aktualisieren – {asset.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="update-value">Betrag</Label>
            <Input
              id="update-value"
              inputMode="decimal"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="update-value-date">Datum</Label>
            <Input
              id="update-value-date"
              type="date"
              max={todayIso()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !value.trim()}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
