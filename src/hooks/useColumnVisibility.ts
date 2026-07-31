import { useEffect, useState } from "react";

export interface OptionalColumn {
  key: string;
  label: string;
}

export const OPTIONAL_COLUMNS: OptionalColumn[] = [
  { key: "purpose", label: "Verwendungszweck" },
  { key: "asset_name", label: "Quellkonto" },
  { key: "external_id", label: "Buchungs-ID" },
  { key: "tags", label: "Tags" },
  { key: "transaction_type", label: "Transaktionstyp" },
  { key: "card_payment_at", label: "Karteneinsatz-Zeitpunkt" },
  { key: "cash_withdrawal_at", label: "Bargeldabhebung-Zeitpunkt" },
  { key: "recipient_iban", label: "Empfänger-IBAN" },
  { key: "recipient_bic", label: "Empfänger-BIC" },
  { key: "recipient_account_number", label: "Empfänger-Kontonummer" },
  { key: "description", label: "Beschreibung" },
  { key: "bank_category", label: "Bank-Kategorie" },
  { key: "bank_subcategory", label: "Bank-Unterkategorie" },
  { key: "bank_account_label", label: "Kontoname (Bank)" },
];

const STORAGE_KEY = "klarwert.transactions.visibleColumns";

/** Lokale UI-Präferenz (B3b Spalten-Auswahl) – alle optionalen Spalten standardmäßig aus. */
export function useColumnVisibility() {
  const [visible, setVisible] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visible]));
  }, [visible]);

  function toggle(key: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return { visible, toggle };
}
