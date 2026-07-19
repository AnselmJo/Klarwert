import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Tags,
  FileText,
  FolderKanban,
  Target,
  Landmark,
  Calculator,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore, type PageKey } from "@/stores/navigationStore";
import { usePersons } from "@/hooks/usePersons";
import { KlarwertLogo } from "@/components/KlarwertMark";

interface NavItemDef {
  key: PageKey;
  label: string;
  icon: typeof Wallet;
}

const GROUPS: { title: string; items: NavItemDef[] }[] = [
  {
    title: "Erfassen",
    items: [
      { key: "uebersicht", label: "Übersicht", icon: LayoutDashboard },
      { key: "vermoegen", label: "Vermögen", icon: Wallet },
      { key: "transaktionen", label: "Transaktionen", icon: Receipt },
    ],
  },
  {
    title: "Ordnen",
    items: [
      { key: "kategorien", label: "Kategorien", icon: Tags },
      { key: "vertraege", label: "Verträge", icon: FileText },
      { key: "sammlungen", label: "Sammlungen", icon: FolderKanban },
    ],
  },
  {
    title: "Planen",
    items: [
      { key: "budgets", label: "Budgets", icon: Target },
      { key: "steuer", label: "Steuer", icon: Landmark },
      { key: "rechner", label: "Rechner", icon: Calculator },
    ],
  },
];

export function Sidebar() {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const navigate = useNavigationStore((s) => s.navigate);
  const { data: persons } = usePersons();
  const householdLabel =
    persons && persons.length > 0
      ? persons.length === 1
        ? persons[0].name
        : `${persons[0].name} +${persons.length - 1}`
      : "Haushalt";

  return (
    <nav
      aria-label="Hauptnavigation"
      className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-card"
    >
      <div className="flex items-center px-5 py-5">
        <KlarwertLogo className="h-7 w-auto" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate">
              {group.title}
            </div>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => navigate(item.key)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-klein px-2.5 py-2 text-sm text-charcoal transition-colors",
                        active
                          ? "bg-petrol text-card"
                          : "hover:bg-accent",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("profil")}
        aria-current={currentPage === "profil" ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 border-t border-border px-5 py-4 text-sm text-charcoal transition-colors",
          currentPage === "profil" ? "bg-accent" : "hover:bg-accent",
        )}
      >
        <span className="inline-block size-2 rounded-full bg-sage" />
        <span className="flex-1 truncate text-left">{householdLabel}</span>
        <Settings className="size-4 text-slate" />
      </button>
    </nav>
  );
}
