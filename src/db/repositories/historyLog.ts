import { getDb } from "@/db/client";
import type { HistoryLogEntry } from "@/db/types";

export async function addHistoryEntry(input: {
  action_type: string;
  description: string;
  payload: unknown;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "insert into history_log (action_type, description, payload_json) values ($1, $2, $3)",
    [input.action_type, input.description, JSON.stringify(input.payload)],
  );
  return result.lastInsertId as number;
}

export async function listHistory(limit = 50): Promise<HistoryLogEntry[]> {
  const db = await getDb();
  return db.select<HistoryLogEntry[]>(
    "select * from history_log order by created_at desc limit $1",
    [limit],
  );
}

export async function markNotUndoable(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("update history_log set is_undoable = 0 where id = $1", [id]);
}

export async function getHistoryEntry(id: number): Promise<HistoryLogEntry | null> {
  const db = await getDb();
  const rows = await db.select<HistoryLogEntry[]>("select * from history_log where id = $1", [id]);
  return rows[0] ?? null;
}
