import { withTransaction } from "@/db/client";
import { runPipelineForTransactions } from "@/lib/pipeline";
import { detectRecurringPatterns } from "@/lib/contractDetection";
import { normalizeFingerprint } from "@/db/repositories/transactions";
import { createImportRecord } from "@/db/repositories/imports";
import { addValueHistoryEntry, getAnchor } from "@/db/repositories/valueHistory";
import { parseAmountWithFormat } from "@/lib/money";
import { parseDateWithFormat, isoDayBefore, todayIso } from "@/lib/dates";
import { EXTRA_FIELD_ROLES, type ColumnRole } from "@/lib/import/bankProfiles";
import type { ImportMode } from "@/db/types";

export interface RunImportInput {
  assetId: number;
  filename: string;
  profileId: number | null;
  headers: string[];
  rows: string[][];
  roleToIndex: Partial<Record<ColumnRole, number>>;
  extractCounterpartyFromPurpose?: boolean;
  dateFormat: string;
  decimalFormat: "de" | "en";
  mode: ImportMode;
  /** Cents; null wenn "Weiß ich gerade nicht" bzw. bei Folge-Import nicht angegeben. */
  currentBalanceInput: number | null;
  /** Mehrkonten-Datei: nur Zeilen importieren, deren bank_account_label diesem Wert entspricht. */
  bankAccountLabelFilter?: string | null;
}

export interface RunImportResult {
  status: "success" | "failed";
  rowsRead: number;
  rowsNew: number;
  rowsUpdated: number;
  rowsSkipped: number;
  rowsAutoCategorized: number;
  transfersFound: number;
  rowsIgnoredOtherAccount: number;
  lostMetadataCount: number;
  balanceUnconfirmed: boolean;
  balanceMismatchCents: number | null;
  errorMessage?: string;
}

interface ParsedRow {
  booking_date: string;
  counterparty: string;
  purpose: string | null;
  amount_cents: number;
  external_id: string | null;
  fingerprint: string;
  extra_fields_json: string | null;
}

const COMDIRECT_PREFIX = /(?:Auftraggeber|Empf[aä]nger):\s*(.+?)(?:\s{2,}|$)/i;

function extractCounterparty(text: string): { counterparty: string; purpose: string } {
  const match = COMDIRECT_PREFIX.exec(text);
  if (match) {
    return { counterparty: match[1].trim(), purpose: text.replace(match[0], "").trim() };
  }
  return { counterparty: text, purpose: text };
}

function buildExtraFields(
  row: string[],
  roleToIndex: Partial<Record<ColumnRole, number>>,
): string | null {
  const entries: [string, string][] = [];
  for (const role of EXTRA_FIELD_ROLES) {
    const idx = roleToIndex[role];
    if (idx === undefined) continue;
    const value = (row[idx] ?? "").trim();
    if (value) entries.push([role, value]);
  }
  return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries)) : null;
}

/** Distinkte Werte der Kontoname-Spalte, um Mehrkonten-Dateien (z. B. C24) zu erkennen. */
export function detectBankAccountLabels(
  rows: string[][],
  roleToIndex: Partial<Record<ColumnRole, number>>,
): string[] {
  const idx = roleToIndex.bank_account_label;
  if (idx === undefined) return [];
  const values = new Set<string>();
  for (const row of rows) {
    const v = (row[idx] ?? "").trim();
    if (v) values.add(v);
  }
  return [...values];
}

function parseRows(input: RunImportInput): { parsed: ParsedRow[]; skipped: number; ignoredOtherAccount: number } {
  const { roleToIndex, rows, dateFormat, decimalFormat, extractCounterpartyFromPurpose } = input;
  const parsed: ParsedRow[] = [];
  let skipped = 0;
  let ignoredOtherAccount = 0;

  for (const row of rows) {
    if (input.bankAccountLabelFilter && roleToIndex.bank_account_label !== undefined) {
      const label = (row[roleToIndex.bank_account_label] ?? "").trim();
      if (label !== input.bankAccountLabelFilter) {
        ignoredOtherAccount += 1;
        continue;
      }
    }
    try {
      const dateIdx = roleToIndex.date;
      const amountIdx = roleToIndex.amount;
      const counterpartyIdx = roleToIndex.counterparty;
      if (dateIdx === undefined || amountIdx === undefined || counterpartyIdx === undefined) {
        skipped += 1;
        continue;
      }
      const booking_date = parseDateWithFormat(row[dateIdx], dateFormat);
      const amount_cents = parseAmountWithFormat(row[amountIdx], decimalFormat);
      let counterparty = (row[counterpartyIdx] ?? "").trim();
      let purpose =
        roleToIndex.purpose !== undefined ? (row[roleToIndex.purpose] ?? "").trim() : null;

      if (extractCounterpartyFromPurpose && purpose) {
        const extracted = extractCounterparty(purpose);
        counterparty = extracted.counterparty || counterparty;
        purpose = extracted.purpose;
      }

      if (!counterparty) {
        skipped += 1;
        continue;
      }

      const external_id =
        roleToIndex.external_id !== undefined
          ? (row[roleToIndex.external_id] ?? "").trim() || null
          : null;

      parsed.push({
        booking_date,
        counterparty,
        purpose: purpose || null,
        amount_cents,
        external_id,
        fingerprint: normalizeFingerprint(booking_date, amount_cents, counterparty),
        extra_fields_json: buildExtraFields(row, roleToIndex),
      });
    } catch {
      skipped += 1;
    }
  }

  return { parsed, skipped, ignoredOtherAccount };
}

export async function runImport(input: RunImportInput): Promise<RunImportResult> {
  const { parsed, skipped: parseSkipped, ignoredOtherAccount } = parseRows(input);

  try {
    const result = await withTransaction(async (db) => {
      let rowsNew = 0;
      let rowsUpdated = 0;
      let rowsSkipped = parseSkipped;
      let lostMetadataCount = 0;
      const newlyInsertedIds: number[] = [];

      const anchorBefore = await getAnchor(input.assetId);
      const isFirstImport = !anchorBefore;

      if (input.mode === "replace_all") {
        interface Preserved {
          category_id: number | null;
          categorization_source: string;
          is_reviewed: 0 | 1;
          is_saving: 0 | 1;
          sparzweck_id: number | null;
          exclude_from_stats: 0 | 1;
          tag_ids: number[];
        }
        const existing = await db.select<
          {
            id: number;
            fingerprint: string;
            category_id: number | null;
            categorization_source: string;
            is_reviewed: 0 | 1;
            is_saving: 0 | 1;
            sparzweck_id: number | null;
            exclude_from_stats: 0 | 1;
          }[]
        >(
          "select id, fingerprint, category_id, categorization_source, is_reviewed, is_saving, sparzweck_id, exclude_from_stats from transactions where asset_id = $1 and source = 'import'",
          [input.assetId],
        );
        const preserved = new Map<string, Preserved>();
        for (const row of existing) {
          const tagRows = await db.select<{ tag_id: number }[]>(
            "select tag_id from transaction_tags where transaction_id = $1",
            [row.id],
          );
          preserved.set(row.fingerprint, { ...row, tag_ids: tagRows.map((t) => t.tag_id) });
        }

        await db.execute("delete from transactions where asset_id = $1 and source = 'import'", [
          input.assetId,
        ]);

        const matchedFingerprints = new Set<string>();
        for (const row of parsed) {
          const meta = preserved.get(row.fingerprint);
          if (meta) matchedFingerprints.add(row.fingerprint);
          const insertResult = await db.execute(
            `insert into transactions
              (asset_id, booking_date, counterparty, purpose, amount_cents, source, external_id, fingerprint, extra_fields_json, category_id, categorization_source, is_reviewed, is_saving, sparzweck_id, exclude_from_stats)
             values ($1, $2, $3, $4, $5, 'import', $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              input.assetId,
              row.booking_date,
              row.counterparty,
              row.purpose,
              row.amount_cents,
              row.external_id,
              row.fingerprint,
              row.extra_fields_json,
              meta?.category_id ?? null,
              meta?.categorization_source ?? "none",
              meta?.is_reviewed ?? 1,
              meta?.is_saving ?? 0,
              meta?.sparzweck_id ?? null,
              meta?.exclude_from_stats ?? 0,
            ],
          );
          const newId = insertResult.lastInsertId as number;
          if (meta) {
            for (const tagId of meta.tag_ids) {
              await db.execute(
                "insert into transaction_tags (transaction_id, tag_id) values ($1, $2)",
                [newId, tagId],
              );
            }
          } else {
            newlyInsertedIds.push(newId);
          }
          rowsNew += 1;
        }
        lostMetadataCount = preserved.size - matchedFingerprints.size;
      } else {
        for (const row of parsed) {
          let existingId: number | null = null;
          if (row.external_id) {
            const rows = await db.select<{ id: number }[]>(
              "select id from transactions where asset_id = $1 and external_id = $2 and source = 'import'",
              [input.assetId, row.external_id],
            );
            existingId = rows[0]?.id ?? null;
          } else {
            const rows = await db.select<{ id: number }[]>(
              "select id from transactions where asset_id = $1 and fingerprint = $2 and source = 'import'",
              [input.assetId, row.fingerprint],
            );
            existingId = rows[0]?.id ?? null;
          }

          if (existingId) {
            if (row.external_id) {
              await db.execute(
                `update transactions set booking_date = $1, counterparty = $2, purpose = $3, amount_cents = $4, fingerprint = $5, extra_fields_json = $6
                 where id = $7`,
                [
                  row.booking_date,
                  row.counterparty,
                  row.purpose,
                  row.amount_cents,
                  row.fingerprint,
                  row.extra_fields_json,
                  existingId,
                ],
              );
              rowsUpdated += 1;
            } else {
              rowsSkipped += 1;
            }
          } else {
            const insertResult = await db.execute(
              `insert into transactions
                (asset_id, booking_date, counterparty, purpose, amount_cents, source, external_id, fingerprint, extra_fields_json)
               values ($1, $2, $3, $4, $5, 'import', $6, $7, $8)`,
              [
                input.assetId,
                row.booking_date,
                row.counterparty,
                row.purpose,
                row.amount_cents,
                row.external_id,
                row.fingerprint,
                row.extra_fields_json,
              ],
            );
            newlyInsertedIds.push(insertResult.lastInsertId as number);
            rowsNew += 1;
          }
        }
      }

      let balanceUnconfirmed = false;
      let balanceMismatchCents: number | null = null;

      if (isFirstImport) {
        if (input.currentBalanceInput !== null) {
          const sumImported = parsed.reduce((s, r) => s + r.amount_cents, 0);
          const anchorValue = input.currentBalanceInput - sumImported;
          const earliestDate = parsed.reduce(
            (min, r) => (r.booking_date < min ? r.booking_date : min),
            parsed[0]?.booking_date ?? todayIso(),
          );
          await addValueHistoryEntry({
            asset_id: input.assetId,
            valued_at: isoDayBefore(earliestDate),
            value_cents: anchorValue,
            source: "anchor",
          });
          await db.execute(
            "update assets set last_confirmed_balance_cents = $1 where id = $2",
            [input.currentBalanceInput, input.assetId],
          );
        } else {
          balanceUnconfirmed = true;
        }
      } else if (input.currentBalanceInput !== null) {
        const totalRows = await db.select<{ total: number | null }[]>(
          "select sum(amount_cents) as total from transactions where asset_id = $1 and is_deleted = 0",
          [input.assetId],
        );
        const anchorValue = anchorBefore?.value_cents ?? 0;
        const computed = anchorValue + (totalRows[0]?.total ?? 0);
        const diff = computed - input.currentBalanceInput;
        if (Math.abs(diff) >= 1) balanceMismatchCents = diff;
        await db.execute(
          "update assets set last_confirmed_balance_cents = $1 where id = $2",
          [input.currentBalanceInput, input.assetId],
        );
      }

      await db.execute(
        "update assets set last_import_at = $1, import_profile_id = coalesce($2, import_profile_id) where id = $3",
        [new Date().toISOString(), input.profileId, input.assetId],
      );

      return {
        rowsNew,
        rowsUpdated,
        rowsSkipped,
        lostMetadataCount,
        balanceUnconfirmed,
        balanceMismatchCents,
        newlyInsertedIds,
      };
    });

    const pipelineResult = await runPipelineForTransactions(result.newlyInsertedIds);
    await detectRecurringPatterns(input.assetId);

    await createImportRecord({
      asset_id: input.assetId,
      profile_id: input.profileId,
      filename: input.filename,
      mode: input.mode,
      status: "success",
      rows_read: input.rows.length,
      rows_new: result.rowsNew,
      rows_updated: result.rowsUpdated,
      rows_skipped: result.rowsSkipped,
      rows_auto_categorized: pipelineResult.categorized,
    });

    return {
      status: "success" as const,
      rowsRead: input.rows.length,
      rowsNew: result.rowsNew,
      rowsUpdated: result.rowsUpdated,
      rowsSkipped: result.rowsSkipped,
      rowsAutoCategorized: pipelineResult.categorized,
      transfersFound: pipelineResult.transfersFound,
      rowsIgnoredOtherAccount: ignoredOtherAccount,
      lostMetadataCount: result.lostMetadataCount,
      balanceUnconfirmed: result.balanceUnconfirmed,
      balanceMismatchCents: result.balanceMismatchCents,
    };
  } catch (e) {
    await createImportRecord({
      asset_id: input.assetId,
      profile_id: input.profileId,
      filename: input.filename,
      mode: input.mode,
      status: "failed",
      error_message: String(e),
    });
    return {
      status: "failed",
      rowsRead: input.rows.length,
      rowsNew: 0,
      rowsUpdated: 0,
      rowsSkipped: 0,
      rowsAutoCategorized: 0,
      transfersFound: 0,
      rowsIgnoredOtherAccount: 0,
      lostMetadataCount: 0,
      balanceUnconfirmed: false,
      balanceMismatchCents: null,
      errorMessage: String(e),
    };
  }
}
