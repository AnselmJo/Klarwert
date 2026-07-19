export type AssetKind = "account" | "valuable";
export type AccountType = "giro" | "tagesgeld" | "kreditkarte" | "depot" | "darlehen";
export type ValuableType = "bausparvertrag" | "bargeld" | "sonstiges";
export type ValueHistorySource = "manual" | "anchor";
export type PersonRole = "adult" | "child";
export type TransactionSource = "import" | "manual";
export type CategorizationSource = "none" | "manual" | "rule" | "contract";
export type TransferStatus = "suggested" | "confirmed" | null;
export type ImportMode = "upsert" | "replace_all";
export type ImportStatus = "success" | "failed";

export interface Person {
  id: number;
  name: string;
  role: PersonRole;
  birth_year: number | null;
  is_active: 0 | 1;
  created_at: string;
}

export interface Sparzweck {
  id: number;
  name: string;
  color: string;
  target_cents: number | null;
  sort_order: number;
  is_deleted: 0 | 1;
}

export interface ImportProfile {
  id: number;
  name: string;
  is_builtin: 0 | 1;
  header_fingerprint: string | null;
  delimiter: "," | ";" | "\t" | null;
  encoding: string | null;
  date_format: string | null;
  decimal_format: "de" | "en" | null;
  column_map_json: string;
  is_deleted: 0 | 1;
}

export interface Asset {
  id: number;
  name: string;
  kind: AssetKind;
  account_type: AccountType | null;
  valuable_type: ValuableType | null;
  default_sparzweck_id: number | null;
  import_profile_id: number | null;
  last_import_at: string | null;
  last_confirmed_balance_cents: number | null;
  is_archived: 0 | 1;
  is_deleted: 0 | 1;
  created_at: string;
}

export interface AssetOwner {
  asset_id: number;
  person_id: number;
}

export interface ValueHistoryEntry {
  id: number;
  asset_id: number;
  valued_at: string;
  value_cents: number;
  source: ValueHistorySource;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  parent_id: number | null;
  is_template: 0 | 1;
  is_system: 0 | 1;
  is_hidden: 0 | 1;
  sort_order: number;
  is_deleted: 0 | 1;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  is_deleted: 0 | 1;
}

export type RuleField = "purpose" | "counterparty" | "amount" | "asset";
export type RuleOperator = "contains" | "equals" | "approx";

export interface RuleCondition {
  id: number;
  rule_id: number;
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

export type CollectionStatus = "active" | "completed";

export interface Collection {
  id: number;
  name: string;
  is_goal: 0 | 1;
  target_cents: number | null;
  status: CollectionStatus;
  is_deleted: 0 | 1;
  created_at: string;
}

export type ContractInterval = "monthly" | "yearly" | "irregular";
export type ContractStatus = "detected" | "confirmed" | "price_changed" | "paused" | "ended";

export interface Contract {
  id: number;
  name: string;
  current_amount_cents: number;
  previous_amount_cents: number | null;
  interval: ContractInterval;
  status: ContractStatus;
  category_id: number | null;
  detection_method: string | null;
  detected_at: string;
  is_dismissed: 0 | 1;
  is_deleted: 0 | 1;
}

export interface RecurringPayment {
  id: number;
  name: string;
  typical_amount_cents: number;
  detected_at: string;
  is_dismissed: 0 | 1;
  is_deleted: 0 | 1;
}

export interface Rule {
  id: number;
  priority: number;
  category_id: number | null;
  tag_id: number | null;
  mark_as_transfer: 0 | 1;
  mark_as_saving: 0 | 1;
  sparzweck_id: number | null;
  created_at: string;
  is_deleted: 0 | 1;
}

export interface Transaction {
  id: number;
  asset_id: number;
  booking_date: string;
  counterparty: string;
  purpose: string | null;
  amount_cents: number;
  source: TransactionSource;
  external_id: string | null;
  extra_fields_json: string | null;
  fingerprint: string;
  import_id: number | null;
  category_id: number | null;
  categorization_source: CategorizationSource;
  applied_rule_id: number | null;
  is_reviewed: 0 | 1;
  is_transfer: 0 | 1;
  transfer_pair_id: number | null;
  transfer_status: TransferStatus;
  is_saving: 0 | 1;
  sparzweck_id: number | null;
  exclude_from_stats: 0 | 1;
  contract_id: number | null;
  recurring_payment_id: number | null;
  is_deleted: 0 | 1;
  created_at: string;
}

export interface ImportRecord {
  id: number;
  asset_id: number;
  profile_id: number | null;
  filename: string;
  mode: ImportMode;
  status: ImportStatus;
  rows_read: number | null;
  rows_new: number | null;
  rows_updated: number | null;
  rows_skipped: number | null;
  rows_auto_categorized: number | null;
  error_message: string | null;
  created_at: string;
}

export interface HistoryLogEntry {
  id: number;
  action_type: string;
  description: string;
  payload_json: string;
  is_undoable: 0 | 1;
  created_at: string;
}

export type SettingsMap = {
  currency: string;
  import_reminder_days: string;
  kirchensteuer_aktiv: "0" | "1";
  kirchensteuer_satz: "8" | "9";
  onboarding_done: "0" | "1";
};
