import { getDb } from "@/db/client";
import type { Collection } from "@/db/types";
import type { TransactionWithTags } from "@/db/repositories/transactions";

export async function listCollections(): Promise<Collection[]> {
  const db = await getDb();
  return db.select<Collection[]>(
    "select * from collections where is_deleted = 0 order by status asc, created_at desc",
  );
}

export async function createCollection(input: {
  name: string;
  is_goal: boolean;
  target_cents: number | null;
  status: "active" | "completed";
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "insert into collections (name, is_goal, target_cents, status) values ($1, $2, $3, $4)",
    [input.name, input.is_goal ? 1 : 0, input.target_cents, input.status],
  );
  return result.lastInsertId as number;
}

export async function updateCollection(
  id: number,
  input: { name?: string; is_goal?: boolean; target_cents?: number | null; status?: "active" | "completed" },
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (input.name !== undefined) {
    fields.push(`name = $${i++}`);
    values.push(input.name);
  }
  if (input.is_goal !== undefined) {
    fields.push(`is_goal = $${i++}`);
    values.push(input.is_goal ? 1 : 0);
  }
  if (input.target_cents !== undefined) {
    fields.push(`target_cents = $${i++}`);
    values.push(input.target_cents);
  }
  if (input.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(input.status);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`update collections set ${fields.join(", ")} where id = $${i}`, values);
}

/** Löschen entfernt nur die Sammlung selbst – zugeordnete Transaktionen bleiben unverändert. */
export async function deleteCollection(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update collections set is_deleted = 1 where id = $1", [id]);
}

export async function restoreCollection(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update collections set is_deleted = 0 where id = $1", [id]);
}

export async function getCollectionSummary(id: number): Promise<{ sumCents: number; count: number }> {
  const db = await getDb();
  const rows = await db.select<{ sum: number | null; count: number }[]>(
    `select sum(t.amount_cents) as sum, count(*) as count from collection_transactions ct
     join transactions t on t.id = ct.transaction_id and t.is_deleted = 0
     where ct.collection_id = $1`,
    [id],
  );
  return { sumCents: rows[0]?.sum ?? 0, count: rows[0]?.count ?? 0 };
}

export async function getCollectionTransactions(id: number): Promise<TransactionWithTags[]> {
  const db = await getDb();
  const rows = await db.select<TransactionWithTags[]>(
    `select t.* from transactions t
     join collection_transactions ct on ct.transaction_id = t.id
     where ct.collection_id = $1 and t.is_deleted = 0
     order by t.booking_date desc`,
    [id],
  );
  return rows.map((r) => ({ ...r, tag_ids: [] }));
}

export async function removeTransactionFromCollection(collectionId: number, transactionId: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "delete from collection_transactions where collection_id = $1 and transaction_id = $2",
    [collectionId, transactionId],
  );
}

export interface BulkAddPreview {
  matchingIds: number[];
  alreadyIncluded: number;
}

/** Vorschau für "Transaktionen im Zeitraum hinzufügen" (einmaliger Vollzug, keine Dauerregel). */
export async function previewBulkAdd(
  collectionId: number,
  dateFrom: string,
  dateTo: string,
  assetId?: number | null,
  categoryId?: number | null,
): Promise<BulkAddPreview> {
  const db = await getDb();
  const clauses = ["is_deleted = 0", "booking_date >= $1", "booking_date <= $2"];
  const params: unknown[] = [dateFrom, dateTo];
  let i = 3;
  if (assetId) {
    clauses.push(`asset_id = $${i++}`);
    params.push(assetId);
  }
  if (categoryId) {
    clauses.push(`category_id = $${i++}`);
    params.push(categoryId);
  }
  const matches = await db.select<{ id: number }[]>(
    `select id from transactions where ${clauses.join(" and ")}`,
    params,
  );
  const matchingIds = matches.map((m) => m.id);
  if (matchingIds.length === 0) return { matchingIds: [], alreadyIncluded: 0 };
  const placeholders = matchingIds.map((_, idx) => `$${idx + 2}`).join(", ");
  const existing = await db.select<{ transaction_id: number }[]>(
    `select transaction_id from collection_transactions where collection_id = $1 and transaction_id in (${placeholders})`,
    [collectionId, ...matchingIds],
  );
  return { matchingIds, alreadyIncluded: existing.length };
}

export async function addTransactionsToCollection(collectionId: number, transactionIds: number[]): Promise<void> {
  const db = await getDb();
  for (const txId of transactionIds) {
    await db.execute(
      "insert or ignore into collection_transactions (collection_id, transaction_id) values ($1, $2)",
      [collectionId, txId],
    );
  }
}
