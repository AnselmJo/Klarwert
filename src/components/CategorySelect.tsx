import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, groupCategories } from "@/hooks/useCategories";

interface CategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
  placeholder?: string;
  allowNone?: boolean;
}

const NONE = "none";

export function CategorySelect({ value, onChange, placeholder, allowNone = true }: CategorySelectProps) {
  const { data: categories } = useCategories();
  const groups = groupCategories(categories ?? []);

  return (
    <Select
      value={value ? String(value) : NONE}
      onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Kategorie wählen"} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>Unkategorisiert</SelectItem>}
        {groups.map(({ parent, options }) => (
          <SelectGroup key={parent.id}>
            <SelectLabel>{parent.name}</SelectLabel>
            {options.map((o) => (
              <SelectItem key={o.category.id} value={String(o.category.id)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
