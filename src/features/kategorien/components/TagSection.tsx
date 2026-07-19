import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useTags } from "@/hooks/useTags";
import { countTagUsage, deleteTag } from "@/db/repositories/tags";
import { TagEditorModal } from "@/features/kategorien/components/TagEditorModal";
import type { Tag } from "@/db/types";
import { toast } from "sonner";

export function TagSection() {
  const queryClient = useQueryClient();
  const { data: tags } = useTags();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ tag: Tag; count: number } | null>(null);

  const { data: counts } = useQuery({
    queryKey: ["tag-usage-counts", tags?.map((t) => t.id)],
    queryFn: async () => {
      const entries = await Promise.all((tags ?? []).map(async (t) => [t.id, await countTagUsage(t.id)] as const));
      return Object.fromEntries(entries) as Record<number, number>;
    },
    enabled: !!tags,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["tags"] });
    queryClient.invalidateQueries({ queryKey: ["tag-usage-counts"] });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteTag(deleteTarget.tag.id);
    toast.success(`Tag "${deleteTarget.tag.name}" gelöscht`);
    setDeleteTarget(null);
    invalidate();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-charcoal">Tags</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" />
          Tag
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags?.map((t) => (
          <div key={t.id} className="flex items-center gap-1 rounded-pill border border-border bg-card px-2 py-1">
            <Badge style={{ backgroundColor: t.color, color: "#fffdf8" }}>{t.name}</Badge>
            <span className="text-xs text-slate">{counts?.[t.id] ?? 0}×</span>
            <button
              type="button"
              aria-label="Bearbeiten"
              onClick={() => {
                setEditing(t);
                setEditorOpen(true);
              }}
            >
              <Pencil className="size-3.5 text-slate" />
            </button>
            <button
              type="button"
              aria-label="Löschen"
              onClick={() => setDeleteTarget({ tag: t, count: counts?.[t.id] ?? 0 })}
            >
              <Trash2 className="size-3.5 text-slate" />
            </button>
          </div>
        ))}
        {(!tags || tags.length === 0) && <p className="text-sm text-slate">Noch keine Tags.</p>}
      </div>

      <TagEditorModal open={editorOpen} tag={editing} onOpenChange={setEditorOpen} onSaved={invalidate} />
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={`Tag "${deleteTarget.tag.name}" löschen?`}
          description={`${deleteTarget.count} Transaktionen verlieren diesen Tag.`}
          confirmLabel="Löschen"
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
