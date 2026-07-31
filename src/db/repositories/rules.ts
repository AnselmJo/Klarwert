import { getDb } from "@/db/client";
import type { Rule, RuleCondition, RuleField, RuleOperator } from "@/db/types";

export interface RuleWithConditions extends Rule {
  conditions: RuleCondition[];
}

export interface RuleConditionInput {
  field: RuleField;
  operator: RuleOperator;
  value: string;
}

export interface RuleActionsInput {
  category_id: number | null;
  tag_id: number | null;
  mark_as_transfer: boolean;
  mark_as_saving: boolean;
  sparzweck_id: number | null;
}

/** Alle Regeln in globaler Prioritätsreihenfolge (kleinste Zahl zuerst geprüft). */
export async function listRules(): Promise<RuleWithConditions[]> {
  const db = await getDb();
  const rules = await db.select<Rule[]>(
    "select * from rules where is_deleted = 0 order by priority asc",
  );
  if (rules.length === 0) return [];
  const conditions = await db.select<RuleCondition[]>(
    "select * from rule_conditions where rule_id in (select id from rules where is_deleted = 0)",
  );
  const byRule = new Map<number, RuleCondition[]>();
  for (const c of conditions) {
    const list = byRule.get(c.rule_id) ?? [];
    list.push(c);
    byRule.set(c.rule_id, list);
  }
  return rules.map((r) => ({ ...r, conditions: byRule.get(r.id) ?? [] }));
}

export async function countRulesForCategory(categoryId: number): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    "select count(*) as count from rules where category_id = $1 and is_deleted = 0",
    [categoryId],
  );
  return rows[0]?.count ?? 0;
}

export async function getRulesForCategory(categoryId: number): Promise<RuleWithConditions[]> {
  const all = await listRules();
  return all.filter((r) => r.category_id === categoryId);
}

/** Live-Vorschau: wie viele unkategorisierte/alle Transaktionen matchen die Bedingungen (UND-verknüpft)? + Sample */
export async function previewRuleMatches(conditions: RuleConditionInput[]): Promise<{ count: number; sample: any[] }> {
  if (conditions.length === 0) return { count: 0, sample: [] };
  const db = await getDb();
  const clauses: string[] = ["is_deleted = 0"];
  const params: unknown[] = [];
  let i = 1;
  for (const c of conditions) {
    if (!c.value.trim()) continue;
    if (c.field === "amount") {
      const cents = Math.round(Number.parseFloat(c.value.replace(",", ".")) * 100);
      if (Number.isNaN(cents)) continue;
      if (c.operator === "approx") {
        const tolerance = Math.abs(cents) * 0.05;
        clauses.push(`amount_cents between $${i} and $${i + 1}`);
        params.push(cents - tolerance, cents + tolerance);
        i += 2;
      } else {
        clauses.push(`amount_cents = $${i}`);
        params.push(cents);
        i += 1;
      }
    } else if (c.field === "asset") {
      clauses.push(`asset_id = $${i}`);
      params.push(Number(c.value));
      i += 1;
    } else {
      const column = c.field === "purpose" ? "purpose" : "counterparty";
      if (c.operator === "equals") {
        clauses.push(`lower(${column}) = lower($${i})`);
      } else {
        clauses.push(`lower(${column}) like lower($${i})`);
        params.push(`%${c.value}%`);
        i += 1;
        continue;
      }
      params.push(c.value);
      i += 1;
    }
  }
  const whereClause = clauses.join(" and ");
  const countRows = await db.select<{ count: number }[]>(
    `select count(*) as count from transactions where ${whereClause}`,
    params,
  );
  const sampleRows = await db.select<{ booking_date: string; counterparty: string; purpose: string | null; amount_cents: number }[]>(
    `select booking_date, counterparty, purpose, amount_cents from transactions where ${whereClause} order by booking_date desc limit 10`,
    params,
  );
  return {
    count: countRows[0]?.count ?? 0,
    sample: sampleRows,
  };
}

export async function createRule(
  conditions: RuleConditionInput[],
  actions: RuleActionsInput,
  createdFrom: "manual" | "aufraeumen" | "vertrag" = "manual",
  sourceContractId: number | null = null
): Promise<number> {
  const db = await getDb();
  const maxPriority = await db.select<{ max: number | null }[]>(
    "select max(priority) as max from rules where is_deleted = 0",
  );
  const priority = (maxPriority[0]?.max ?? 0) + 1;
  const result = await db.execute(
    `insert into rules (priority, category_id, tag_id, mark_as_transfer, mark_as_saving, sparzweck_id, created_from, source_contract_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      priority,
      actions.category_id,
      actions.tag_id,
      actions.mark_as_transfer ? 1 : 0,
      actions.mark_as_saving ? 1 : 0,
      actions.sparzweck_id,
      createdFrom,
      sourceContractId
    ],
  );
  const ruleId = result.lastInsertId as number;
  for (const c of conditions) {
    await db.execute(
      "insert into rule_conditions (rule_id, field, operator, value) values ($1, $2, $3, $4)",
      [ruleId, c.field, c.operator, c.value],
    );
  }
  return ruleId;
}

export async function updateRule(
  id: number,
  conditions: RuleConditionInput[],
  actions: RuleActionsInput,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `update rules set category_id = $1, tag_id = $2, mark_as_transfer = $3, mark_as_saving = $4, sparzweck_id = $5
     where id = $6`,
    [
      actions.category_id,
      actions.tag_id,
      actions.mark_as_transfer ? 1 : 0,
      actions.mark_as_saving ? 1 : 0,
      actions.sparzweck_id,
      id,
    ],
  );
  await db.execute("delete from rule_conditions where rule_id = $1", [id]);
  for (const c of conditions) {
    await db.execute(
      "insert into rule_conditions (rule_id, field, operator, value) values ($1, $2, $3, $4)",
      [id, c.field, c.operator, c.value],
    );
  }
}

export async function deleteRule(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update rules set is_deleted = 1 where id = $1", [id]);
}

/** Vertauscht die Priorität zweier benachbarter Regeln (Pfeil-Buttons/Drag&Drop). */
export async function swapRulePriority(ruleIdA: number, ruleIdB: number): Promise<void> {
  const db = await getDb();
  const rows = await db.select<{ id: number; priority: number }[]>(
    "select id, priority from rules where id in ($1, $2)",
    [ruleIdA, ruleIdB],
  );
  const a = rows.find((r) => r.id === ruleIdA);
  const b = rows.find((r) => r.id === ruleIdB);
  if (!a || !b) return;
  await db.execute("update rules set priority = $1 where id = $2", [b.priority, a.id]);
  await db.execute("update rules set priority = $1 where id = $2", [a.priority, b.id]);
}

/** Setzt die Priorität aller Regeln gemäß der übergebenen Reihenfolge (Drag&Drop-Reorder). */
export async function reorderRules(orderedIds: number[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < orderedIds.length; i += 1) {
    await db.execute("update rules set priority = $1 where id = $2", [i + 1, orderedIds[i]]);
  }
}
