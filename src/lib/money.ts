const formatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatiert Integer-Cents als deutschen Euro-Betrag, z. B. 124000 -> "1.240,00 €". */
export function formatEur(cents: number): string {
  return `${formatter.format(cents / 100)} €`;
}

/** Parst eine deutsche oder englische Betragsangabe (Text) in Integer-Cents. */
export function parseAmountToCents(input: string): number {
  const trimmed = input.trim();
  const hasComma = trimmed.includes(",");
  const normalized = hasComma
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) {
    throw new Error(`Ungültiger Betrag: "${input}"`);
  }
  return Math.round(value * 100);
}

export function addCents(...values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

/** Parst einen Betrag gemäß explizit bekanntem Dezimalformat (Import: de "1.234,56" / en "1,234.56"). */
export function parseAmountWithFormat(input: string, format: "de" | "en"): number {
  let normalized = input.trim().replace(/[€\s]/g, "");
  normalized =
    format === "de"
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) {
    throw new Error(`Ungültiger Betrag: "${input}"`);
  }
  return Math.round(value * 100);
}
