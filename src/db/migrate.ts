import { getDb } from "@/db/client";
import { seedTemplateCategories } from "@/db/repositories/categories";
import schema001 from "@/db/migrations/001_schema.sql?raw";
import seed002 from "@/db/migrations/002_seed.sql?raw";
import extraFields003 from "@/db/migrations/003_extra_fields.sql?raw";
import tagsSeed004 from "@/db/migrations/004_tags_seed.sql?raw";
import aliasesCustomFields005 from "@/db/migrations/005_aliases_and_custom_fields.sql?raw";
import schemaRound2006 from "@/db/migrations/006_schema_round2.sql?raw";
import aliasesRound2007 from "@/db/migrations/007_aliases_round2.sql?raw";
import fixForeignKeys008 from "@/db/migrations/008_fix_foreign_keys.sql?raw";
import fixAllForeignKeys009 from "@/db/migrations/009_fix_all_foreign_keys.sql?raw";
import personKirchensteuer010 from "@/db/migrations/010_person_kirchensteuer.sql?raw";
import communityDatenbanken011 from "@/db/migrations/011_community_datenbanken.sql?raw";

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
  { version: 5, name: "aliases_and_custom_fields", sql: aliasesCustomFields005 },
  { version: 6, name: "schema_round2", sql: schemaRound2006 },
  { version: 7, name: "aliases_round2", sql: aliasesRound2007 },
  { version: 8, name: "fix_foreign_keys", sql: fixForeignKeys008 },
  { version: 9, name: "fix_all_foreign_keys", sql: fixAllForeignKeys009 },
  { version: 10, name: "person_kirchensteuer", sql: personKirchensteuer010 },
  { version: 11, name: "community_datenbanken", sql: communityDatenbanken011 },
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

/**
 * Stellt sicher, dass nach einem abgebrochenen oder fehlgeschlagenen Migrationsversuch
 * (z. B. wenn _fix_temp oder _clean_temp-Tabellen existieren) die Datenbank vor dem
 * Ausführen ausstehender Migrationen in einen sauberen Zustand zurückversetzt wird.
 */
async function sanitizeDatabaseState(): Promise<void> {
  const db = await getDb();
  await db.execute("PRAGMA foreign_keys = OFF;");
  try {
    const tempTables = await db.select<{ name: string }[]>(
      "select name from sqlite_master where type = 'table' and (name like '%_fix_temp%' or name like '%_clean_temp%' or name like '%_temp')",
    );

    for (const tempTable of tempTables) {
      const tempName = tempTable.name;
      const baseName = tempName
        .replace("_fix_temp", "")
        .replace("_clean_temp", "")
        .replace("_temp", "");

      if (!baseName) continue;

      const mainTableCheck = await db.select<{ count: number }[]>(
        `select count(*) as count from sqlite_master where type = 'table' and name = '${baseName}'`,
      );

      const mainExists = mainTableCheck.length > 0 && mainTableCheck[0].count > 0;

      if (mainExists) {
        let mainCount = 0;
        let tempCount = 0;
        try {
          const resM = await db.select<{ count: number }[]>(`select count(*) as count from ${baseName}`);
          mainCount = resM[0]?.count ?? 0;
        } catch {}
        try {
          const resT = await db.select<{ count: number }[]>(`select count(*) as count from ${tempName}`);
          tempCount = resT[0]?.count ?? 0;
        } catch {}

        if (mainCount === 0 && tempCount > 0) {
          await db.execute(`drop table if exists ${baseName}`);
          await db.execute(`alter table ${tempName} rename to ${baseName}`);
        } else {
          await db.execute(`drop table if exists ${tempName}`);
        }
      } else {
        await db.execute(`alter table ${tempName} rename to ${baseName}`);
      }
    }
  } catch (e) {
    console.warn("Sanitize database state notice:", e);
  } finally {
    await db.execute("PRAGMA foreign_keys = ON;");
  }
}

let migrationsRun: Promise<void> | null = null;

/** Führt alle noch nicht angewendeten, nummerierten Migrationen beim App-Start aus. */
export async function runMigrations(): Promise<void> {
  if (!migrationsRun) {
    migrationsRun = applyMigrations();
  }
  return migrationsRun;
}

async function ensureEssentialColumnsExist(): Promise<void> {
  const db = await getDb();
  const alterStatements = [
    // categories
    "alter table categories add column is_hidden integer not null default 0",
    "alter table categories add column is_template integer not null default 0",
    "alter table categories add column is_system integer not null default 0",
    "alter table categories add column sort_order integer not null default 0",
    "alter table categories add column is_deleted integer not null default 0",
    "alter table categories add column template_key text",

    // transactions
    "alter table transactions add column value_date text",
    "alter table transactions add column extra_fields_json text",
    "alter table transactions add column fingerprint text",
    "alter table transactions add column import_id integer",
    "alter table transactions add column category_id integer",
    "alter table transactions add column categorization_source text default 'none'",
    "alter table transactions add column applied_rule_id integer",
    "alter table transactions add column merchant_id integer",
    "alter table transactions add column categorization_confidence real",
    "alter table transactions add column is_reviewed integer default 1",
    "alter table transactions add column is_transfer integer default 0",
    "alter table transactions add column transfer_pair_id integer",
    "alter table transactions add column transfer_status text",
    "alter table transactions add column is_saving integer default 0",
    "alter table transactions add column sparzweck_id integer",
    "alter table transactions add column exclude_from_stats integer default 0",
    "alter table transactions add column contract_id integer",
    "alter table transactions add column recurring_payment_id integer",
    "alter table transactions add column is_deleted integer default 0",

    // import_profiles
    "alter table import_profiles add column source_version text",

    // rules
    "alter table rules add column created_from text not null default 'manual'",
    "alter table rules add column source_contract_id integer",

    // contracts
    "alter table contracts add column is_manual integer not null default 0",
    "alter table contracts add column generated_rule_id integer",

    // recurring_payments
    "alter table recurring_payments add column category_id integer",

    // persons
    "alter table persons add column birth_year integer",
    "alter table persons add column kirchensteuer_aktiv integer not null default 0",
    "alter table persons add column bundesland text",
  ];

  for (const stmt of alterStatements) {
    try {
      await db.execute(stmt);
    } catch {
      // Ignoriere Fehler wie "duplicate column name" oder "no such table"
    }
  }
}

async function applyMigrations(): Promise<void> {
  const db = await getDb();

  // Bereinige evtl. vorhandene temporäre Tabellen aus vorherigen abgebrochenen Durchläufen
  await sanitizeDatabaseState();

  // Stellt sicher, dass neuere Spalten existieren, selbst bei unvollständigen/älteren DB-Ständen
  await ensureEssentialColumnsExist();

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

  if (pending.length > 0) {
    await db.execute("PRAGMA foreign_keys = OFF;");
    try {
      for (const migration of pending) {
        for (const statement of splitStatements(migration.sql)) {
          try {
            await db.execute(statement);
          } catch (e) {
            const errStr = String(e).toLowerCase();
            // Ignoriere unschädliche Fehler, wenn Spalten/Tabellen/Indizes bereits existieren
            if (
              errStr.includes("duplicate column name") ||
              errStr.includes("already exists")
            ) {
              console.warn(
                `[Migration v${migration.version} '${migration.name}'] Ignoriere redundantes DDL:`,
                statement,
              );
            } else {
              throw e;
            }
          }
        }
        await db.execute(
          "insert into _migrations (version, name) values ($1, $2)",
          [migration.version, migration.name],
        );
      }
    } finally {
      await db.execute("PRAGMA foreign_keys = ON;");
    }
  }

  // Self-healing check: Überprüfen, ob in sqlite_master noch verwaiste Referenzen auf _old/_fix_temp existieren
  try {
    const corrupted = await db.select<{ name: string }[]>(
      "select name from sqlite_master where type = 'table' and (sql like '%_old%' or sql like '%_fix_temp%')",
    );
    if (corrupted.length > 0) {
      await db.execute("PRAGMA foreign_keys = OFF;");
      try {
        for (const statement of splitStatements(fixAllForeignKeys009)) {
          await db.execute(statement);
        }
      } finally {
        await db.execute("PRAGMA foreign_keys = ON;");
      }
    }
  } catch {
    /* Self-healing Check ignorieren falls Schema intakt */
  }

  // Stellt sicher, dass Standard-Kategorien und Händler immer existieren (idempotent, siehe CLAUDE.md "Daten-Robustheit")
  await seedTemplateCategories();
  try {
    const { seedDefaultMerchants } = await import("@/db/repositories/merchants");
    await seedDefaultMerchants();
  } catch (e) {
    console.warn("Merchant seed notice:", e);
  }
}

/**
 * Repariert die Datenbank: Führt Bereinigung verwaister Temp-Tabellen aus,
 * wendet ausstehende Migrationen an und führt ein PRAGMA quick_check aus.
 */
export async function repairDatabase(): Promise<void> {
  migrationsRun = null;
  const db = await getDb();
  await sanitizeDatabaseState();
  await applyMigrations();
  const checkResult = await db.select<{ quick_check: string }[]>("PRAGMA quick_check;");
  if (checkResult.length > 0 && checkResult[0].quick_check !== "ok") {
    throw new Error(`Integritätsprüfung fehlgeschlagen: ${checkResult[0].quick_check}`);
  }
}

/**
 * Setzt die komplette Datenbank auf Werkszustand zurück.
 * Löscht alle Benutzertabellen, führt Migrationen neu aus und setzt Onboarding zurück.
 */
export async function resetDatabase(): Promise<void> {
  migrationsRun = null;
  const db = await getDb();

  await db.execute("PRAGMA foreign_keys = OFF;");
  try {
    const tables = await db.select<{ name: string }[]>(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'",
    );
    for (const { name } of tables) {
      await db.execute(`drop table if exists ${name}`);
    }
  } finally {
    await db.execute("PRAGMA foreign_keys = ON;");
  }

  await applyMigrations();

  await db.execute(
    "insert or replace into settings (key, value) values ('onboarding_done', '0')",
  );
}


