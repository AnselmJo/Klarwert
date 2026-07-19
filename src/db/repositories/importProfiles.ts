import { getDb } from "@/db/client";
import type { ImportProfile } from "@/db/types";

export async function listImportProfiles(): Promise<ImportProfile[]> {
  const db = await getDb();
  return db.select<ImportProfile[]>(
    "select * from import_profiles where is_deleted = 0 order by is_builtin desc, name asc",
  );
}

export async function findByFingerprint(fingerprint: string): Promise<ImportProfile | null> {
  const db = await getDb();
  const rows = await db.select<ImportProfile[]>(
    "select * from import_profiles where header_fingerprint = $1 and is_deleted = 0 limit 1",
    [fingerprint],
  );
  return rows[0] ?? null;
}

export interface CreateImportProfileInput {
  name: string;
  is_builtin?: boolean;
  header_fingerprint?: string | null;
  delimiter: "," | ";" | "\t";
  encoding?: string;
  date_format?: string;
  decimal_format: "de" | "en";
  column_map_json: string;
}

export async function createImportProfile(input: CreateImportProfileInput): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `insert into import_profiles
      (name, is_builtin, header_fingerprint, delimiter, encoding, date_format, decimal_format, column_map_json)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.name,
      input.is_builtin ? 1 : 0,
      input.header_fingerprint ?? null,
      input.delimiter,
      input.encoding ?? "utf-8",
      input.date_format ?? null,
      input.decimal_format,
      input.column_map_json,
    ],
  );
  return result.lastInsertId as number;
}
