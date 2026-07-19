import { getDb } from "@/db/client";
import type { Contract } from "@/db/types";

export async function listContracts(): Promise<Contract[]> {
  const db = await getDb();
  return db.select<Contract[]>(
    "select * from contracts where is_deleted = 0 order by detected_at desc",
  );
}

export async function updateContractStatus(id: number, status: Contract["status"]): Promise<void> {
  const db = await getDb();
  if (status === "confirmed") {
    await db.execute(
      "update contracts set status = $1, previous_amount_cents = null where id = $2",
      [status, id],
    );
  } else {
    await db.execute("update contracts set status = $1 where id = $2", [status, id]);
  }
}

export async function dismissContract(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update contracts set is_dismissed = 1, status = 'ended' where id = $1", [id]);
}

export async function updateContractCategory(id: number, categoryId: number | null): Promise<void> {
  const db = await getDb();
  await db.execute("update contracts set category_id = $1 where id = $2", [categoryId, id]);
  await db.execute("update transactions set category_id = $1 where contract_id = $2", [categoryId, id]);
}

export async function getRecentTransactionsForContract(contractId: number, limit = 10) {
  const db = await getDb();
  return db.select<{ id: number; booking_date: string; amount_cents: number; counterparty: string }[]>(
    "select id, booking_date, amount_cents, counterparty from transactions where contract_id = $1 and is_deleted = 0 order by booking_date desc limit $2",
    [contractId, limit],
  );
}
