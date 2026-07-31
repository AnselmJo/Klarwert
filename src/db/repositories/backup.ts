import { getDb, runInTransaction } from "@/db/client";
import { seedTemplateCategories } from "@/db/repositories/categories";

export interface BackupData {
  version: number;
  exported_at: string;
  tables: Record<string, any[]>;
}

const BACKUP_TABLES = [
  "persons",
  "sparzwecke",
  "import_profiles",
  "assets",
  "asset_owners",
  "value_history",
  "categories",
  "category_aliases",
  "tags",
  "transaction_tags",
  "custom_fields",
  "rules",
  "rule_conditions",
  "collections",
  "contracts",
  "recurring_payments",
  "transactions",
  "transaction_splits",
  "transaction_custom_values",
  "import_records",
  "steuer_themen",
  "steuer_thema_categories",
  "steuer_thema_keywords",
  "settings",
];

export async function exportBackupJson(): Promise<string> {
  const db = await getDb();
  const tablesData: Record<string, any[]> = {};

  for (const table of BACKUP_TABLES) {
    try {
      const rows = await db.select<any[]>(`select * from ${table}`);
      tablesData[table] = rows;
    } catch {
      tablesData[table] = [];
    }
  }

  const backup: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    tables: tablesData,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importBackupJson(jsonContent: string): Promise<void> {
  let data: BackupData;
  try {
    data = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error(`Ungültiges JSON-Format: ${String(e)}`);
  }

  if (!data || typeof data !== "object" || !data.tables) {
    throw new Error("Ungültiges Backup-Schema: 'tables' Eigenschaft fehlt.");
  }

  await runInTransaction(async (db) => {
    // Clear existing tables in reverse dependency order
    for (const table of [...BACKUP_TABLES].reverse()) {
      try {
        await db.execute(`delete from ${table}`);
      } catch {
        /* table might not exist */
      }
    }

    // Insert backup rows
    for (const table of BACKUP_TABLES) {
      const rows = data.tables[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        const columns = keys.join(", ");
        const values = keys.map((k) => row[k]);

        await db.execute(
          `insert into ${table} (${columns}) values (${placeholders})`,
          values,
        );
      }
    }
  });

  await seedTemplateCategories();
}

export async function deleteAllData(): Promise<void> {
  await runInTransaction(async (db) => {
    for (const table of [...BACKUP_TABLES].reverse()) {
      try {
        await db.execute(`delete from ${table}`);
      } catch {
        /* ignore */
      }
    }
    // Set onboarding_done to false in settings
    await db.execute("insert or replace into settings (key, value) values ('onboarding_done', '0')");
  });

  await seedTemplateCategories();
}
