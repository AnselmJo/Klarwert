import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/CategorySelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSparzwecke } from "@/hooks/useSparzwecke";
import { useTags } from "@/hooks/useTags";
import { useCollections } from "@/hooks/useCollections";
import {
  applyBulkFieldUpdate,
  applyBulkJoinAdd,
  undoBulkFieldUpdate,
  undoBulkJoinAdd,
  type BulkFieldUpdatePayload,
  type BulkJoinAddPayload,
} from "@/lib/transactionBulkActions";
import { getHistoryEntry } from "@/db/repositories/historyLog";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedIds: number[];
  onClearSelection: () => void;
  onChanged: () => void;
}

export function BulkActionBar({ selectedIds, onClearSelection, onChanged }: BulkActionBarProps) {
  const { data: sparzwecke } = useSparzwecke();
  const { data: tags } = useTags();
  const { data: collections } = useCollections();

  async function runAction(fields: Parameters<typeof applyBulkFieldUpdate>[1], description: string) {
    const historyId = await applyBulkFieldUpdate(selectedIds, fields, description);
    onChanged();
    toast(description, {
      action: {
        label: "Rückgängig",
        onClick: async () => {
          const entry = await getHistoryEntry(historyId);
          if (!entry) return;
          await undoBulkFieldUpdate(JSON.parse(entry.payload_json) as BulkFieldUpdatePayload);
          onChanged();
        },
      },
    });
  }

  async function runJoinAction(
    table: "transaction_tags" | "collection_transactions",
    parentColumn: string,
    childColumn: string,
    childId: number,
    description: string,
  ) {
    const historyId = await applyBulkJoinAdd(
      table,
      parentColumn,
      childColumn,
      selectedIds.map((id) => ({ parentId: id, childId })),
      description,
    );
    onChanged();
    toast(description, {
      action: {
        label: "Rückgängig",
        onClick: async () => {
          const entry = await getHistoryEntry(historyId);
          if (!entry) return;
          await undoBulkJoinAdd(JSON.parse(entry.payload_json) as BulkJoinAddPayload);
          onChanged();
        },
      },
    });
  }

  async function handleAddTag(tagId: number) {
    await runJoinAction("transaction_tags", "transaction_id", "tag_id", tagId, "Tag zugewiesen");
  }

  async function handleAddToCollection(collectionId: number) {
    await runJoinAction("collection_transactions", "transaction_id", "collection_id", collectionId, "Zu Sammlung hinzugefügt");
  }

  if (selectedIds.length === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`Sammelaktionen für ${selectedIds.length} ausgewählte Transaktionen`}
      className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-2 border-t border-border bg-charcoal px-6 py-3 text-card"
    >
      <span className="text-sm">{selectedIds.length} ausgewählt</span>

      <div className="w-44">
        <CategorySelect
          value={null}
          onChange={(id) =>
            id !== null &&
            void runAction({ category_id: id, categorization_source: "manual" }, "Kategorie zugewiesen")
          }
          placeholder="Kategorie"
          allowNone={false}
        />
      </div>

      <div className="w-36">
        <Select onValueChange={(v) => void handleAddTag(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            {tags?.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select onValueChange={(v) => void handleAddToCollection(Number(v))}>
          <SelectTrigger>
            <SelectValue placeholder="Sammlung" />
          </SelectTrigger>
          <SelectContent>
            {collections?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select
          onValueChange={(v) =>
            void runAction({ is_saving: 1, sparzweck_id: Number(v) }, "Als Sparen markiert")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sparen (+Zweck)" />
          </SelectTrigger>
          <SelectContent>
            {sparzwecke?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="text-card hover:text-charcoal"
        onClick={() => void runAction({ is_transfer: 1 }, "Als Transfer markiert")}
      >
        Transfer
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-card hover:text-charcoal"
        onClick={() => void runAction({ is_reviewed: 0 }, "Als ungeprüft markiert")}
      >
        Ungeprüft
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-card hover:text-charcoal"
        onClick={() => void runAction({ exclude_from_stats: 1 }, "Aus Statistik entfernt")}
      >
        Aus Statistik entfernen
      </Button>

      <Button size="sm" variant="ghost" className="ml-auto text-card hover:text-charcoal" onClick={onClearSelection}>
        <X className="mr-1 size-4" />
        Auswahl aufheben
      </Button>
    </div>
  );
}
