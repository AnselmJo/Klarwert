import { Info, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalFilterStore } from "@/stores/globalFilterStore";
import { usePersons } from "@/hooks/usePersons";
import { useAssets } from "@/hooks/useAssets";
import { NotificationBellPopover } from "@/features/benachrichtigungen/NotificationBellPopover";

const ALL = "all";

export function Globalbar() {
  const { data: assets } = useAssets(false);
  const { data: persons } = usePersons();
  const selectedAccountId = useGlobalFilterStore((s) => s.selectedAccountId);
  const selectedPersonId = useGlobalFilterStore((s) => s.selectedPersonId);
  const setSelectedAccountId = useGlobalFilterStore((s) => s.setSelectedAccountId);
  const setSelectedPersonId = useGlobalFilterStore((s) => s.setSelectedPersonId);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-3">
      <Select
        value={selectedAccountId ? String(selectedAccountId) : ALL}
        onValueChange={(v) => setSelectedAccountId(v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="w-[180px]" aria-label="Konto-Filter">
          <SelectValue placeholder="Alle Konten" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Konten</SelectItem>
          {assets?.map((a) => (
            <SelectItem key={a.id} value={String(a.id)}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedPersonId ? String(selectedPersonId) : ALL}
        onValueChange={(v) => setSelectedPersonId(v === ALL ? null : Number(v))}
      >
        <SelectTrigger className="w-[160px]" aria-label="Personen-Filter">
          <SelectValue placeholder="Alle Personen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Personen</SelectItem>
          {persons?.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex size-6 items-center justify-center rounded-full text-slate">
            <Info className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px]">
          Filtert alle angezeigten Beträge und Listen. Stammdaten (Kategorien,
          Regeln, Einstellungen) bleiben immer vollständig sichtbar.
        </TooltipContent>
      </Tooltip>

      <div className="relative ml-2 flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate" />
        <Input
          disabled
          placeholder="Verträge, Sammlungen, Kategorien durchsuchen…"
          className="pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBellPopover />
      </div>
    </div>
  );
}
