import { useState } from "react";
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
import { CategorySelect } from "@/components/CategorySelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssets } from "@/hooks/useAssets";
import { addTransactionsToCollection, previewBulkAdd, type BulkAddPreview } from "@/db/repositories/collections";
import { todayIso } from "@/lib/dates";
import { toast } from "sonner";

interface AddByPeriodModalProps {
  open: boolean;
  collectionId: number;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddByPeriodModal({ open, collectionId, onOpenChange, onAdded }: AddByPeriodModalProps) {
  const { data: assets } = useAssets(false);
  const [dateFrom, setDateFrom] = useState(todayIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [assetId, setAssetId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [preview, setPreview] = useState<BulkAddPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePreview() {
    const result = await previewBulkAdd(collectionId, dateFrom, dateTo, assetId, categoryId);
    setPreview(result);
  }

  async function handleConfirm() {
    if (!preview) return;
    setSubmitting(true);
    try {
      await addTransactionsToCollection(collectionId, preview.matchingIds);
      toast.success(`${preview.matchingIds.length - preview.alreadyIncluded} Transaktionen hinzugefügt`);
      onAdded();
      setPreview(null);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPreview(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Transaktionen im Zeitraum hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-from">Von</Label>
              <Input id="add-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-to">Bis</Label>
              <Input id="add-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Konto (optional)</Label>
            <Select value={assetId ? String(assetId) : "all"} onValueChange={(v) => setAssetId(v === "all" ? null : Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Konten</SelectItem>
                {assets?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kategorie (optional)</Label>
            <CategorySelect value={categoryId} onChange={setCategoryId} allowNone={false} placeholder="Alle Kategorien" />
          </div>
          {preview && (
            <p className="text-sm text-slate">
              {preview.matchingIds.length} Treffer, {preview.alreadyIncluded} bereits enthalten.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          {!preview ? (
            <Button onClick={() => void handlePreview()}>Vorschau</Button>
          ) : (
            <Button onClick={() => void handleConfirm()} disabled={submitting}>
              Hinzufügen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
