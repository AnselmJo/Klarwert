import { getDb } from "@/db/client";
import { todayIso } from "@/lib/dates";
import type { AssetWithOwners } from "@/db/repositories/assets";

interface AnchorInfo {
  value: number;
  date: string;
}

interface TxLite {
  asset_id: number;
  booking_date: string;
  amount_cents: number;
}

interface ValueHistoryLite {
  asset_id: number;
  valued_at: string;
  value_cents: number;
}

async function fetchAnchors(): Promise<Map<number, AnchorInfo>> {
  const db = await getDb();
  const rows = await db.select<{ asset_id: number; valued_at: string; value_cents: number }[]>(
    "select asset_id, valued_at, value_cents from value_history where source = 'anchor'",
  );
  const map = new Map<number, AnchorInfo>();
  for (const r of rows) {
    map.set(r.asset_id, { value: r.value_cents, date: r.valued_at });
  }
  return map;
}

async function fetchTransactionsLite(): Promise<TxLite[]> {
  const db = await getDb();
  return db.select<TxLite[]>(
    "select asset_id, booking_date, amount_cents from transactions where is_deleted = 0",
  );
}

async function fetchValuableHistory(): Promise<Map<number, ValueHistoryLite[]>> {
  const db = await getDb();
  const rows = await db.select<ValueHistoryLite[]>(
    "select asset_id, valued_at, value_cents from value_history order by valued_at asc, id asc",
  );
  const map = new Map<number, ValueHistoryLite[]>();
  for (const r of rows) {
    const list = map.get(r.asset_id) ?? [];
    list.push(r);
    map.set(r.asset_id, list);
  }
  return map;
}

function accountBalanceAt(
  assetId: number,
  cutoff: string,
  anchors: Map<number, AnchorInfo>,
  txByAsset: Map<number, TxLite[]>,
): number {
  const anchor = anchors.get(assetId);
  const anchorValue = anchor?.value ?? 0;
  const anchorDate = anchor?.date ?? "0000-01-01";
  const txs = txByAsset.get(assetId) ?? [];
  let sum = 0;
  for (const tx of txs) {
    if (tx.booking_date > anchorDate && tx.booking_date <= cutoff) {
      sum += tx.amount_cents;
    }
  }
  return anchorValue + sum;
}

function valuableValueAt(
  assetId: number,
  cutoff: string,
  historyByAsset: Map<number, ValueHistoryLite[]>,
): number {
  const history = historyByAsset.get(assetId) ?? [];
  let value = 0;
  for (const entry of history) {
    if (entry.valued_at <= cutoff) value = entry.value_cents;
    else break;
  }
  return value;
}

function groupByAsset(txs: TxLite[]): Map<number, TxLite[]> {
  const map = new Map<number, TxLite[]>();
  for (const tx of txs) {
    const list = map.get(tx.asset_id) ?? [];
    list.push(tx);
    map.set(tx.asset_id, list);
  }
  return map;
}

/** Aktueller Kontostand/Wertstand je Asset (Anker + Transaktionen bzw. letzter Wertehistorie-Eintrag). */
export async function getCurrentBalances(
  assets: AssetWithOwners[],
): Promise<Map<number, number>> {
  const [anchors, txs, valuableHistory] = await Promise.all([
    fetchAnchors(),
    fetchTransactionsLite(),
    fetchValuableHistory(),
  ]);
  const txByAsset = groupByAsset(txs);
  const today = todayIso();
  const result = new Map<number, number>();
  for (const asset of assets) {
    if (asset.kind === "account") {
      result.set(asset.id, accountBalanceAt(asset.id, today, anchors, txByAsset));
    } else {
      result.set(asset.id, valuableValueAt(asset.id, today, valuableHistory));
    }
  }
  return result;
}

export interface NetWorthPoint {
  period: string;
  cents: number;
}

/** Netto-Vermögen über die letzten `months` Monatsenden (letzter Punkt = heute). */
export async function getNetWorthSeries(
  assets: AssetWithOwners[],
  months = 12,
): Promise<NetWorthPoint[]> {
  const [anchors, txs, valuableHistory] = await Promise.all([
    fetchAnchors(),
    fetchTransactionsLite(),
    fetchValuableHistory(),
  ]);
  const txByAsset = groupByAsset(txs);

  const cutoffs: { label: string; date: string }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    if (i === 0) {
      cutoffs.push({ label: todayIso(), date: todayIso() });
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const iso = d.toISOString().slice(0, 10);
      cutoffs.push({ label: iso, date: iso });
    }
  }

  return cutoffs.map(({ label, date }) => {
    let total = 0;
    for (const asset of assets) {
      total +=
        asset.kind === "account"
          ? accountBalanceAt(asset.id, date, anchors, txByAsset)
          : valuableValueAt(asset.id, date, valuableHistory);
    }
    return { period: label, cents: total };
  });
}

export async function getAssetIdsWithAnchor(): Promise<Set<number>> {
  const anchors = await fetchAnchors();
  return new Set(anchors.keys());
}

/** Sparkline-Punkte (kumulierter Kontostand) für ein einzelnes Konto, jüngste zuerst abgeschnitten. */
export async function getAccountSparkline(assetId: number, maxPoints = 15): Promise<number[]> {
  const db = await getDb();
  const anchor = await db.select<{ valued_at: string; value_cents: number }[]>(
    "select valued_at, value_cents from value_history where asset_id = $1 and source = 'anchor' limit 1",
    [assetId],
  );
  const anchorValue = anchor[0]?.value_cents ?? 0;
  const txs = await db.select<{ booking_date: string; amount_cents: number }[]>(
    "select booking_date, amount_cents from transactions where asset_id = $1 and is_deleted = 0 order by booking_date asc, id asc",
    [assetId],
  );
  const points: number[] = [];
  let running = anchorValue;
  for (const tx of txs) {
    running += tx.amount_cents;
    points.push(running);
  }
  if (points.length === 0) return [];
  return points.slice(-maxPoints);
}
