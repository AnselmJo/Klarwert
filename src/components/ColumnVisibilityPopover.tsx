import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OPTIONAL_COLUMNS } from "@/hooks/useColumnVisibility";

interface ColumnVisibilityPopoverProps {
  visible: Set<string>;
  onToggle: (key: string) => void;
}

/** B3b Spalten-Auswahl. */
export function ColumnVisibilityPopover({ visible, onToggle }: ColumnVisibilityPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Spalten ein-/ausblenden">
          <Eye className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" role="menu">
        <div className="space-y-2">
          {OPTIONAL_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2 text-sm">
              <Checkbox checked={visible.has(col.key)} onCheckedChange={() => onToggle(col.key)} />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
