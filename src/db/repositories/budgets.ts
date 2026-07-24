import { getDb } from "@/db/client";
import { getPeriodRange, shiftPeriod, type PeriodType } from "@/lib/periods";

export interface Budget {
  id: number;
  category_id: number;
  limit_cents: number;
  period_type: PeriodType;
  is_deleted: 0 | 1;
}

export interface BudgetHistoryPoint {
  label: string;
  spentCents: number;
  limitCents: number;
}

export interface BudgetSummary extends Budget {
  categoryName: string;
  parentName: string | null;
  categoryColor: string;
  spentCents: number;
  remainingCents: number;
  usage: number;
  periodLabel: string;
  periodFrom: string;
  periodTo: string;
  history: BudgetHistoryPoint[];
}

export interface BudgetFilter {
  assetId?: number | null;
  personId?: number | null;
}

export interface BudgetPeriod {
  label: string;
  from: string;
  to: string;
}

function assetFilterClause(alias: string, filter: BudgetFilter, startIndex: number) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = startIndex;
  if (filter.assetId) {
    clauses.push(`${alias}.asset_id = $${i++}`);
    params.push(filter.assetId);
  }
  if (filter.personId) {
    clauses.push(
      `${alias}.asset_id in (select asset_id from asset_owners where person_id = $${i++})`,
    );
    params.push(filter.personId);
  }
  return { clause: clauses.join(" and "), params };
}

async function categoryIdsForBudget(categoryId: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db.select<{ id: number; parent_id: number | null }[]>(
    "select id, parent_id from categories where id = $1 and is_deleted = 0",
    [categoryId],
  );
  const category = rows[0];
  if (!category) return [categoryId];
  if (category.parent_id !== null) return [categoryId];

  const children = await db.select<{ id: number }[]>(
    "select id from categories where parent_id = $1 and is_deleted = 0",
    [categoryId],
  );
  return [categoryId, ...children.map((child) => child.id)];
}

async function spentForPeriod(
  categoryIds: number[],
  period: BudgetPeriod,
  filter: BudgetFilter,
): Promise<number> {
  if (categoryIds.length === 0) return 0;
  const db = await getDb();
  const placeholders = categoryIds.map((_, idx) => `$${idx + 3}`).join(", ");
  const assetFilter = assetFilterClause("t", filter, categoryIds.length + 3);
  const rows = await db.select<{ spent: number | null }[]>(
    `select coalesce(sum(-t.amount_cents), 0) as spent
     from transactions t
     where t.is_deleted = 0
       and t.booking_date >= $1
       and t.booking_date <= $2
       and t.category_id in (${placeholders})
       and t.amount_cents < 0
       and t.is_transfer = 0
       and t.is_saving = 0
       and t.exclude_from_stats = 0
       ${assetFilter.clause ? `and ${assetFilter.clause}` : ""}`,
    [period.from, period.to, ...categoryIds, ...assetFilter.params],
  );
  return rows[0]?.spent ?? 0;
}

function getBudgetPeriods(type: PeriodType, anchorIso: string): {
  current: BudgetPeriod;
  history: BudgetPeriod[];
} {
  const anchor = new Date(`${anchorIso}T00:00:00`);
  const current = getPeriodRange(type, anchor);
  const history: BudgetPeriod[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    let shifted = anchor;
    for (let step = 0; step < offset; step += 1) {
      shifted = shiftPeriod(type, shifted, -1);
    }
    history.push(getPeriodRange(type, shifted));
  }
  return { current, history };
}

export async function listBudgets(
  anchorIso: string,
  filter: BudgetFilter = {},
): Promise<BudgetSummary[]> {
  const db = await getDb();
  const budgets = await db.select<
    (Budget & {
      categoryName: string;
      parentName: string | null;
      categoryColor: string;
    })[]
  >(
    `select
       b.*,
       c.name as categoryName,
       parent.name as parentName,
       coalesce(parent.color, c.color) as categoryColor
     from budgets b
     join categories c on c.id = b.category_id
     left join categories parent on parent.id = c.parent_id
     where b.is_deleted = 0 and c.is_deleted = 0
     order by c.sort_order asc, c.name asc`,
  );

  const summaries = await Promise.all(
    budgets.map(async (budget) => {
      const ids = await categoryIdsForBudget(budget.category_id);
      const periods = getBudgetPeriods(budget.period_type, anchorIso);
      const currentPeriod = periods.current;
      const spentCents = await spentForPeriod(ids, currentPeriod, filter);
      const history = await Promise.all(
        periods.history.map(async (period) => ({
          label: period.label,
          spentCents: await spentForPeriod(ids, period, filter),
          limitCents: budget.limit_cents,
        })),
      );
      return {
        ...budget,
        spentCents,
        remainingCents: budget.limit_cents - spentCents,
        usage: budget.limit_cents > 0 ? spentCents / budget.limit_cents : 0,
        periodLabel: currentPeriod.label,
        periodFrom: currentPeriod.from,
        periodTo: currentPeriod.to,
        history,
      };
    }),
  );

  return summaries.sort((a, b) => b.usage - a.usage);
}

export async function createBudget(input: {
  category_id: number;
  limit_cents: number;
  period_type: PeriodType;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "insert into budgets (category_id, limit_cents, period_type) values ($1, $2, $3)",
    [input.category_id, input.limit_cents, input.period_type],
  );
  return result.lastInsertId as number;
}

export async function updateBudget(
  id: number,
  input: { limit_cents?: number; period_type?: PeriodType },
): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  if (input.limit_cents !== undefined) {
    fields.push(`limit_cents = $${i++}`);
    params.push(input.limit_cents);
  }
  if (input.period_type !== undefined) {
    fields.push(`period_type = $${i++}`);
    params.push(input.period_type);
  }
  if (fields.length === 0) return;
  const db = await getDb();
  params.push(id);
  await db.execute(`update budgets set ${fields.join(", ")} where id = $${i}`, params);
}

export async function deleteBudget(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update budgets set is_deleted = 1 where id = $1", [id]);
}

export async function listBudgetedCategoryIds(): Promise<number[]> {
  const db = await getDb();
  const rows = await db.select<{ category_id: number }[]>(
    "select category_id from budgets where is_deleted = 0",
  );
  return rows.map((row) => row.category_id);
}
