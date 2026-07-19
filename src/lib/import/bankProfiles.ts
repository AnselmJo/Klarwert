import { computeHeaderFingerprint } from "@/lib/import/fingerprint";
import { createImportProfile, listImportProfiles } from "@/db/repositories/importProfiles";

export type ColumnRole =
  | "date"
  | "amount"
  | "counterparty"
  | "purpose"
  | "external_id"
  | "transaction_type"
  | "card_payment_at"
  | "cash_withdrawal_at"
  | "recipient_iban"
  | "recipient_bic"
  | "recipient_account_number"
  | "description"
  | "bank_category"
  | "bank_subcategory"
  | "bank_account_label";

export const EXTRA_FIELD_ROLES: ColumnRole[] = [
  "transaction_type",
  "card_payment_at",
  "cash_withdrawal_at",
  "recipient_iban",
  "recipient_bic",
  "recipient_account_number",
  "description",
  "bank_category",
  "bank_subcategory",
  "bank_account_label",
];

export type ColumnMap = Partial<Record<ColumnRole, string>>;

export interface BuiltinBankProfile {
  name: string;
  delimiter: "," | ";" | "\t";
  encoding: string;
  dateFormat: string;
  decimalFormat: "de" | "en";
  headers: string[];
  columnMap: ColumnMap;
  /** comdirect: Empfänger steckt im Buchungstext, wird per Präfix-Parser extrahiert. */
  extractCounterpartyFromPurpose?: boolean;
}

export const BUILTIN_BANK_PROFILES: BuiltinBankProfile[] = [
  {
    name: "Sparkasse (CSV-CAMT)",
    delimiter: ";",
    encoding: "windows-1252",
    dateFormat: "dd.MM.yy",
    decimalFormat: "de",
    headers: [
      "Buchungstag",
      "Betrag",
      "Beguenstigter/Zahlungspflichtiger",
      "Verwendungszweck",
      "Kundenreferenz (End-to-End)",
    ],
    columnMap: {
      date: "Buchungstag",
      amount: "Betrag",
      counterparty: "Beguenstigter/Zahlungspflichtiger",
      purpose: "Verwendungszweck",
      external_id: "Kundenreferenz (End-to-End)",
    },
  },
  {
    name: "ING",
    delimiter: ";",
    encoding: "windows-1252",
    dateFormat: "dd.MM.yyyy",
    decimalFormat: "de",
    headers: ["Buchung", "Betrag", "Auftraggeber/Empfänger", "Verwendungszweck"],
    columnMap: {
      date: "Buchung",
      amount: "Betrag",
      counterparty: "Auftraggeber/Empfänger",
      purpose: "Verwendungszweck",
    },
  },
  {
    name: "DKB",
    delimiter: ",",
    encoding: "utf-8",
    dateFormat: "dd.MM.yy",
    decimalFormat: "de",
    headers: [
      "Buchungsdatum",
      "Betrag (€)",
      "Zahlungsempfänger*in",
      "Verwendungszweck",
      "Kundenreferenz",
    ],
    columnMap: {
      date: "Buchungsdatum",
      amount: "Betrag (€)",
      counterparty: "Zahlungsempfänger*in",
      purpose: "Verwendungszweck",
      external_id: "Kundenreferenz",
    },
  },
  {
    name: "comdirect",
    delimiter: ";",
    encoding: "windows-1252",
    dateFormat: "dd.MM.yyyy",
    decimalFormat: "de",
    headers: ["Buchungstag", "Umsatz in EUR", "Buchungstext"],
    columnMap: {
      date: "Buchungstag",
      amount: "Umsatz in EUR",
      purpose: "Buchungstext",
      counterparty: "Buchungstext",
    },
    extractCounterpartyFromPurpose: true,
  },
  {
    name: "Commerzbank",
    delimiter: ";",
    encoding: "windows-1252",
    dateFormat: "dd.MM.yyyy",
    decimalFormat: "de",
    headers: ["Buchungstag", "Betrag", "Buchungstext"],
    columnMap: {
      date: "Buchungstag",
      amount: "Betrag",
      purpose: "Buchungstext",
    },
  },
  {
    name: "Volksbank/GLS (VR)",
    delimiter: ";",
    encoding: "windows-1252",
    dateFormat: "dd.MM.yyyy",
    decimalFormat: "de",
    headers: ["Buchungstag", "Betrag", "Name Zahlungsbeteiligter", "Verwendungszweck"],
    columnMap: {
      date: "Buchungstag",
      amount: "Betrag",
      counterparty: "Name Zahlungsbeteiligter",
      purpose: "Verwendungszweck",
    },
  },
  {
    name: "N26",
    delimiter: ",",
    encoding: "utf-8",
    dateFormat: "yyyy-MM-dd",
    decimalFormat: "en",
    headers: ["Booking Date", "Amount (EUR)", "Partner Name", "Payment Reference"],
    columnMap: {
      date: "Booking Date",
      amount: "Amount (EUR)",
      counterparty: "Partner Name",
      purpose: "Payment Reference",
    },
  },
  {
    name: "Trade Republic",
    delimiter: ";",
    encoding: "utf-8",
    dateFormat: "dd.MM.yyyy",
    decimalFormat: "de",
    headers: ["Datum", "Betrag", "Beschreibung"],
    columnMap: {
      date: "Datum",
      amount: "Betrag",
      purpose: "Beschreibung",
    },
  },
];

let seeded = false;

/** Legt die mitgelieferten Bankprofile beim ersten Start an (idempotent). */
export async function ensureBuiltinBankProfiles(): Promise<void> {
  if (seeded) return;
  const existing = await listImportProfiles();
  const existingNames = new Set(existing.filter((p) => p.is_builtin).map((p) => p.name));
  for (const profile of BUILTIN_BANK_PROFILES) {
    if (existingNames.has(profile.name)) continue;
    await createImportProfile({
      name: profile.name,
      is_builtin: true,
      header_fingerprint: computeHeaderFingerprint(profile.headers),
      delimiter: profile.delimiter,
      encoding: profile.encoding,
      date_format: profile.dateFormat,
      decimal_format: profile.decimalFormat,
      column_map_json: JSON.stringify(profile.columnMap),
    });
  }
  seeded = true;
}
