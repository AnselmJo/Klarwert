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
  import_all_columns?: boolean;
}

export async function createImportProfile(input: CreateImportProfileInput): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `insert into import_profiles
      (name, is_builtin, header_fingerprint, delimiter, encoding, date_format, decimal_format, column_map_json, import_all_columns)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.name,
      input.is_builtin ? 1 : 0,
      input.header_fingerprint ?? null,
      input.delimiter,
      input.encoding ?? "utf-8",
      input.date_format ?? null,
      input.decimal_format,
      input.column_map_json,
      input.import_all_columns ? 1 : 0,
    ],
  );
  return result.lastInsertId as number;
}

export async function updateImportProfile(
  id: number,
  input: Partial<CreateImportProfileInput>,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `update import_profiles set
      header_fingerprint = coalesce($1, header_fingerprint),
      delimiter = coalesce($2, delimiter),
      encoding = coalesce($3, encoding),
      date_format = coalesce($4, date_format),
      decimal_format = coalesce($5, decimal_format),
      column_map_json = coalesce($6, column_map_json),
      import_all_columns = coalesce($7, import_all_columns)
     where id = $8`,
    [
      input.header_fingerprint ?? null,
      input.delimiter ?? null,
      input.encoding ?? null,
      input.date_format ?? null,
      input.decimal_format ?? null,
      input.column_map_json ?? null,
      input.import_all_columns === undefined ? null : (input.import_all_columns ? 1 : 0),
      id,
    ],
  );
}

