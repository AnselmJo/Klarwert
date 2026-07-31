import { getDb } from "@/db/client";
import { listRules, type RuleWithConditions } from "@/db/repositories/rules";
import type Database from "@tauri-apps/plugin-sql";
import type { RuleField, RuleOperator } from "@/db/types";

export interface SuggestTx {
  asset_id: number;
  counterparty: string;
  purpose: string | null;
  amount_cents: number;
}

export function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function conditionMatches(field: RuleField, operator: RuleOperator, value: string, tx: SuggestTx): boolean {
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

export function findMatchingRule(rules: RuleWithConditions[], tx: SuggestTx): RuleWithConditions | null {
  for (const rule of rules) {
    if (rule.conditions.length === 0) continue;
    const allMatch = rule.conditions.every((c) => conditionMatches(c.field, c.operator, c.value, tx));
    if (allMatch) return rule;
  }
  return null;
}

/**
 * Vorschlagslogik (Product Spec 4.3b):
 * 1. Regel-Match (liefert category_id)
 * 2. Letzte manuelle Kategorisierung desselben normalisierten Empfängers
 * 3. Alias-Match (Kategorie-Namen oder in der DB definierte Aliase)
 */
export async function suggestCategory(
  tx: SuggestTx,
  dbOrNull?: Database
): Promise<number | null> {
  const db = dbOrNull ?? (await getDb());
  
  // 1. Regel-Match
  const rules = await listRules();
  const ruleMatch = findMatchingRule(rules, tx);
  if (ruleMatch && ruleMatch.category_id !== null) {
    return ruleMatch.category_id;
  }

  const cpNorm = normalize(tx.counterparty);
  if (!cpNorm) return null;

  // 2. Letzte manuelle Kategorisierung
  const manualMatches = await db.select<{ category_id: number }[]>(
    `select category_id from transactions 
     where is_deleted = 0 
       and categorization_source = 'manual' 
       and lower(trim(counterparty)) = $1 
       and category_id is not null
     order by booking_date desc, id desc limit 1`,
    [cpNorm]
  );
  if (manualMatches.length > 0) {
    return manualMatches[0].category_id;
  }

  // 3. Alias-Match (Kategorie-Namen oder in categories_aliases definiert)
  const categories = await db.select<{ id: number; name: string }[]>(
    "select id, name from categories where is_deleted = 0"
  );
  
  // Exakter Match mit Kategorienamen
  const nameMatch = categories.find(c => normalize(c.name) === cpNorm);
  if (nameMatch) return nameMatch.id;

  // Teilwort-Match mit Aliases
  // Alias-Table check
  let aliases: { category_id: number; alias: string }[] = [];
  try {
    aliases = await db.select<{ category_id: number; alias: string }[]>(
      "select category_id, alias from category_aliases"
    );
  } catch (e) {
    // category_aliases might not exist in old schemas, ignore
  }
  
  for (const alias of aliases) {
    if (cpNorm.includes(normalize(alias.alias))) {
      return alias.category_id;
    }
  }

  return null;
}
