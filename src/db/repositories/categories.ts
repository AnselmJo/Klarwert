import { getDb } from "@/db/client";
import type { Category } from "@/db/types";

export async function listCategories(includeHidden = true): Promise<Category[]> {
  const db = await getDb();
  const where = includeHidden
    ? "where is_deleted = 0"
    : "where is_deleted = 0 and is_hidden = 0";
  return db.select<Category[]>(
    `select * from categories ${where} order by sort_order asc, name asc`,
  );
}

export async function listTopLevelCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select<Category[]>(
    "select * from categories where is_deleted = 0 and parent_id is null order by sort_order asc, name asc",
  );
}

export async function getCategory(id: number): Promise<Category | null> {
  const db = await getDb();
  const rows = await db.select<Category[]>(
    "select * from categories where id = $1 and is_deleted = 0",
    [id],
  );
  return rows[0] ?? null;
}

export async function getUnkategorisiertId(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ id: number }[]>(
    "select id from categories where is_system = 1 limit 1",
  );
  if (!rows[0]) throw new Error("System-Kategorie 'Unkategorisiert' fehlt");
  return rows[0].id;
}

export async function createCategory(input: {
  name: string;
  color: string;
  icon?: string | null;
  parent_id?: number | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `insert into categories (name, color, icon, parent_id, is_template, sort_order)
     values ($1, $2, $3, $4, 0, 999)`,
    [input.name, input.color, input.icon ?? null, input.parent_id ?? null],
  );
  return result.lastInsertId as number;
}

export async function updateCategory(
  id: number,
  input: Partial<Pick<Category, "name" | "color" | "icon" | "parent_id" | "is_hidden">>,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(input)) {
    fields.push(`${key} = $${i}`);
    values.push(value);
    i += 1;
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`update categories set ${fields.join(", ")} where id = $${i}`, values);
}

export async function countCategoryUsage(id: number): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    "select count(*) as count from transactions where category_id = $1 and is_deleted = 0",
    [id],
  );
  return rows[0]?.count ?? 0;
}

/** Nur eigene Kategorien (is_template = 0) mit 0 Nutzungen löschbar. */
export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update categories set is_deleted = 1 where id = $1 and is_template = 0", [id]);
}

/** Jahres-Summe je Kategorie (respektiert Globalfilter Konto/Person). */
export async function getCategoryYearSums(
  year: number,
  assetId?: number | null,
  personId?: number | null,
): Promise<Map<number, number>> {
  const db = await getDb();
  const clauses = ["t.is_deleted = 0", "t.category_id is not null", "substr(t.booking_date, 1, 4) = $1"];
  const params: unknown[] = [String(year)];
  let i = 2;
  if (assetId) {
    clauses.push(`t.asset_id = $${i}`);
    params.push(assetId);
    i += 1;
  }
  if (personId) {
    clauses.push(`t.asset_id in (select asset_id from asset_owners where person_id = $${i})`);
    params.push(personId);
    i += 1;
  }
  const rows = await db.select<{ category_id: number; total: number }[]>(
    `select category_id, sum(amount_cents) as total from transactions t where ${clauses.join(" and ")} group by category_id`,
    params,
  );
  return new Map(rows.map((r) => [r.category_id, r.total]));
}

export async function setCategoryHidden(id: number, hidden: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("update categories set is_hidden = $1 where id = $2 and is_system = 0", [
    hidden ? 1 : 0,
    id,
  ]);
}
