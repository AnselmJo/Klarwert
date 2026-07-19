import { getDb } from "@/db/client";
import schema001 from "@/db/migrations/001_schema.sql?raw";
import seed002 from "@/db/migrations/002_seed.sql?raw";
import extraFields003 from "@/db/migrations/003_extra_fields.sql?raw";
import tagsSeed004 from "@/db/migrations/004_tags_seed.sql?raw";

interface MigrationDef {
  version: number;
  name: string;
  sql: string;
}

const MIGRATIONS: MigrationDef[] = [
  { version: 1, name: "schema", sql: schema001 },
  { version: 2, name: "seed", sql: seed002 },
  { version: 3, name: "extra_fields", sql: extraFields003 },
  { version: 4, name: "tags_seed", sql: tagsSeed004 },
];

/**
 * Teilt ein SQL-Skript an Top-Level-Semikola in Einzelstatements auf.
 * Berücksichtigt Semikola innerhalb von '...'-String-Literalen (inkl. '' als
 * escapetes Anführungszeichen) sowie innerhalb von `--`-Zeilenkommentaren,
 * damit z. B. `check (x in (';'))` oder `-- hex; ...` nicht fälschlich brechen.
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inString = false;
  let inLineComment = false;

  for (let idx = 0; idx < sql.length; idx += 1) {
    const char = sql[idx];
    current += char;

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (char === "'") {
      if (inString && sql[idx + 1] === "'") {
        current += sql[idx + 1];
        idx += 1;
      } else {
        inString = !inString;
      }
    } else if (!inString && char === "-" && sql[idx + 1] === "-") {
      inLineComment = true;
      current += sql[idx + 1];
      idx += 1;
    } else if (char === ";" && !inString) {
      const trimmed = current.slice(0, -1).trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
    }
  }

  const rest = current.trim();
  if (rest.length > 0) statements.push(rest);

  return statements;
}

let migrationsRun: Promise<void> | null = null;

/** Führt alle noch nicht angewendeten, nummerierten Migrationen beim App-Start aus. */
export async function runMigrations(): Promise<void> {
  if (!migrationsRun) {
    migrationsRun = applyMigrations();
  }
  return migrationsRun;
}

async function applyMigrations(): Promise<void> {
  const db = await getDb();

  await db.execute(
    `create table if not exists _migrations (
      version integer primary key
    , name text not null
    , applied_at text not null default (datetime('now'))
    )`,
  );

  const applied = await db.select<{ version: number }[]>(
    "select version from _migrations",
  );
  const appliedVersions = new Set(applied.map((row) => row.version));

  const pending = MIGRATIONS.filter((m) => !appliedVersions.has(m.version)).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    for (const statement of splitStatements(migration.sql)) {
      await db.execute(statement);
    }
    await db.execute(
      "insert into _migrations (version, name) values ($1, $2)",
      [migration.version, migration.name],
    );
  }
}
