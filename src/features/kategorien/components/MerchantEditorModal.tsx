import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/CategorySelect";
import { createMerchant, updateMerchant } from "@/db/repositories/merchants";
import type { Merchant } from "@/db/types";
import { toast } from "sonner";

interface MerchantEditorModalProps {
  open: boolean;
  merchant: Merchant | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** Anlegen/Bearbeiten eines EIGENEN Händlers (Component Library B14). Kuratierte Händler laufen nicht hierüber. */
export function MerchantEditorModal({ open, merchant, onOpenChange, onSaved }: MerchantEditorModalProps) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(merchant?.display_name ?? "");
      setCategoryId(merchant?.default_category_id ?? null);
    }
  }, [open, merchant]);

  async function handleSave() {
    if (!displayName.trim()) return;
    setSubmitting(true);
    try {
      if (merchant) {
        await updateMerchant(merchant.id, { display_name: displayName.trim(), default_category_id: categoryId });
        toast.success("Händler aktualisiert");
      } else {
        await createMerchant({
          canonical_name: displayName.trim(),
          display_name: displayName.trim(),
          default_category_id: categoryId,
          is_builtin: 0,
        });
        toast.success("Händler angelegt");
      }
      queryClient.invalidateQueries({ queryKey: ["merchants"] });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Fehler: ${String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{merchant ? "Händler bearbeiten" : "Neuer Händler"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="merchant-name">Anzeigename</Label>
            <Input id="merchant-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Standardkategorie</Label>
            <CategorySelect value={categoryId} onChange={setCategoryId} allowNone />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => void handleSave()} disabled={submitting || !displayName.trim()}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
