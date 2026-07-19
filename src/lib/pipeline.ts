import { getDb } from "@/db/client";
import { listRules, type RuleWithConditions } from "@/db/repositories/rules";
import type { RuleField, RuleOperator } from "@/db/types";

interface PipelineTx {
  id: number;
  asset_id: number;
  booking_date: string;
  counterparty: string;
  purpose: string | null;
  amount_cents: number;
  category_id: number | null;
  categorization_source: string;
  is_transfer: 0 | 1;
}

export interface PipelineResult {
  categorized: number;
  transfersFound: number;
}

let kontentransferCategoryIdCache: number | null = null;

async function getKontentransferCategoryId(): Promise<number | null> {
  if (kontentransferCategoryIdCache !== null) return kontentransferCategoryIdCache;
  const db = await getDb();
  const rows = await db.select<{ id: number }[]>(
    `select id from categories where name = 'Kontentransfer' and parent_id in
       (select id from categories where name = 'Bank und Kredit') limit 1`,
  );
  kontentransferCategoryIdCache = rows[0]?.id ?? null;
  return kontentransferCategoryIdCache;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function conditionMatches(field: RuleField, operator: RuleOperator, value: string, tx: PipelineTx): boolean {
  if (field === "amount") {
    const target = Math.round(Number.parseFloat(value.replace(",", ".")) * 100);
    if (Number.isNaN(target)) return false;
    if (operator === "approx") return Math.abs(tx.amount_cents - target) <= Math.abs(target) * 0.05;
    return tx.amount_cents === target;
  }
  if (field === "asset") {
    return tx.asset_id === Number(value);
  }
  const column = field === "purpose" ? tx.purpose ?? "" : tx.counterparty;
  if (operator === "equals") return normalize(column) === normalize(value);
  return normalize(column).includes(normalize(value));
}

function findMatchingRule(rules: RuleWithConditions[], tx: PipelineTx): RuleWithConditions | null {
  for (const rule of rules) {
    if (rule.conditions.length === 0) continue;
    const allMatch = rule.conditions.every((c) => conditionMatches(c.field, c.operator, c.value, tx));
    if (allMatch) return rule;
  }
  return null;
}

async function findMatchingContract(tx: PipelineTx): Promise<{ id: number; category_id: number | null } | null> {
  const db = await getDb();
  const contracts = await db.select<
    { id: number; name: string; current_amount_cents: number; category_id: number | null }[]
  >(
    "select id, name, current_amount_cents, category_id from contracts where is_deleted = 0 and status in ('confirmed', 'price_changed')",
  );
  for (const c of contracts) {
    const nameNormalized = normalize(c.name);
    const counterpartyNormalized = normalize(tx.counterparty);
    const namesMatch =
      counterpartyNormalized.includes(nameNormalized) || nameNormalized.includes(counterpartyNormalized);
    const amountMatches = Math.abs(tx.amount_cents - c.current_amount_cents) <= Math.abs(c.current_amount_cents) * 0.05;
    if (namesMatch && amountMatches) return { id: c.id, category_id: c.category_id };
  }
  return null;
}

async function findTransferPartner(tx: PipelineTx): Promise<PipelineTx | null> {
  const db = await getDb();
  const dismissed = await db.select<{ asset_id_a: number; asset_id_b: number; amount_cents: number }[]>(
    "select asset_id_a, asset_id_b, amount_cents from dismissed_transfer_patterns",
  );
  const isDismissed = (otherAssetId: number, amount: number) =>
    dismissed.some(
      (d) =>
        Math.abs(d.amount_cents) === Math.abs(amount) &&
        ((d.asset_id_a === tx.asset_id && d.asset_id_b === otherAssetId) ||
          (d.asset_id_b === tx.asset_id && d.asset_id_a === otherAssetId)),
    );

  const candidates = await db.select<PipelineTx[]>(
    `select id, asset_id, booking_date, counterparty, purpose, amount_cents, category_id, categorization_source, is_transfer
     from transactions
     where is_deleted = 0 and asset_id != $1 and is_transfer = 0
       and amount_cents = $2
       and julianday(booking_date) between julianday($3) - 2 and julianday($3) + 2`,
    [tx.asset_id, -tx.amount_cents, tx.booking_date],
  );
  return candidates.find((c) => !isDismissed(c.asset_id, c.amount_cents)) ?? null;
}

async function applyTransferPair(txA: PipelineTx, txB: PipelineTx, categoryId: number | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "update transactions set is_transfer = 1, transfer_pair_id = $1, transfer_status = 'suggested', category_id = coalesce(category_id, $2) where id = $3",
    [txB.id, categoryId, txA.id],
  );
  await db.execute(
    "update transactions set is_transfer = 1, transfer_pair_id = $1, transfer_status = 'suggested', category_id = coalesce(category_id, $2) where id = $3",
    [txA.id, categoryId, txB.id],
  );

  const outgoing = txA.amount_cents < 0 ? txA : txB;
  const incoming = outgoing === txA ? txB : txA;
  const destination = await db.select<{ account_type: string | null; default_sparzweck_id: number | null }[]>(
    "select account_type, default_sparzweck_id from assets where id = $1",
    [incoming.asset_id],
  );
  const dest = destination[0];
  if (dest && (dest.account_type === "tagesgeld" || dest.account_type === "depot")) {
    await db.execute("update transactions set is_saving = 1, sparzweck_id = coalesce(sparzweck_id, $1) where id = $2", [
      dest.default_sparzweck_id,
      outgoing.id,
    ]);
  }
}

async function applyRule(tx: PipelineTx, rule: RuleWithConditions): Promise<boolean> {
  const db = await getDb();
  const categoryId = rule.category_id ?? tx.category_id;
  await db.execute(
    `update transactions set
       category_id = coalesce($1, category_id),
       categorization_source = case when $1 is not null then 'rule' else categorization_source end,
       applied_rule_id = $2,
       is_transfer = case when $3 = 1 then 1 else is_transfer end,
       is_saving = case when $4 = 1 then 1 else is_saving end,
       sparzweck_id = coalesce($5, sparzweck_id)
     where id = $6`,
    [categoryId, rule.id, rule.mark_as_transfer, rule.mark_as_saving, rule.sparzweck_id, tx.id],
  );
  if (rule.tag_id) {
    await db.execute(
      "insert or ignore into transaction_tags (transaction_id, tag_id) values ($1, $2)",
      [tx.id, rule.tag_id],
    );
  }
  return !!rule.category_id;
}

/**
 * Kategorisierungs-Pipeline (Product Spec Kap. 3): Manuell > Vertrag > Transfer-Erkennung > Regeln > Unkategorisiert.
 * Läuft nach jedem Import sowie bei manueller Transaktionsanlage. Überschreibt nie manuelle Zuweisungen.
 */
export async function runPipelineForTransactions(transactionIds: number[]): Promise<PipelineResult> {
  if (transactionIds.length === 0) return { categorized: 0, transfersFound: 0 };
  const db = await getDb();
  const rules = await listRules();
  const kontentransferCategoryId = await getKontentransferCategoryId();

  let categorized = 0;
  let transfersFound = 0;

  for (const id of transactionIds) {
    const rows = await db.select<PipelineTx[]>(
      `select id, asset_id, booking_date, counterparty, purpose, amount_cents, category_id, categorization_source, is_transfer
       from transactions where id = $1 and is_deleted = 0`,
      [id],
    );
    const tx = rows[0];
    if (!tx || tx.categorization_source === "manual") continue;

    const contractMatch = await findMatchingContract(tx);
    if (contractMatch) {
      await db.execute(
        "update transactions set contract_id = $1, category_id = coalesce(category_id, $2), categorization_source = 'contract' where id = $3",
        [contractMatch.id, contractMatch.category_id, id],
      );
      categorized += 1;
      continue;
    }

    if (!tx.is_transfer) {
      const partner = await findTransferPartner(tx);
      if (partner) {
        await applyTransferPair(tx, partner, kontentransferCategoryId);
        transfersFound += 1;
        continue;
      }
    }

    const rule = findMatchingRule(rules, tx);
    if (rule) {
      const didCategorize = await applyRule(tx, rule);
      if (didCategorize) categorized += 1;
      continue;
    }
  }

  return { categorized, transfersFound };
}
