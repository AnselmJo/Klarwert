import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;
let loading: Promise<Database> | null = null;

/** Öffnet (einmalig) die lokale SQLite-Datenbank. Kein Demo-Modus in Phase 1. */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (!loading) {
    loading = Database.load("sqlite:klarwert.db").then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return loading;
}

/** Führt `fn` innerhalb einer SQLite-Transaktion aus; bei Fehler vollständiges Rollback. */
export async function withTransaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const db = await getDb();
  await db.execute("begin");
  try {
    const result = await fn(db);
    await db.execute("commit");
    return result;
  } catch (e) {
    await db.execute("rollback");
    throw e;
  }
}
