import { getDb } from "@/db/client";

interface Candidate {
  id: number;
  booking_date: string;
  amount_cents: number;
  counterparty: string;
  purpose: string | null;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function amountsConsistent(amounts: number[]): boolean {
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  return amounts.every((a) => Math.abs(a - avg) <= Math.abs(avg) * 0.05);
}

function averageIntervalDays(dates: string[]): number {
  const sorted = [...dates].sort();
  let total = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    total += (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000;
  }
  return total / Math.max(sorted.length - 1, 1);
}

function detectIntervalType(avgDays: number): "monthly" | "yearly" | "irregular" {
  if (avgDays >= 25 && avgDays <= 36) return "monthly";
  if (avgDays >= 350 && avgDays <= 380) return "yearly";
  return "irregular";
}

/**
 * Erkennt neue Verträge/wiederkehrende Zahlungen aus noch nicht zugeordneten Transaktionen
 * eines Kontos und prüft bestehende Verträge auf Preisänderung/Beendigung (Product Spec 4.4).
 */
export async function detectRecurringPatterns(assetId: number): Promise<void> {
  const db = await getDb();

  // Preisänderung + Beendigung bestehender Verträge
  const activeContracts = await db.select<
    { id: number; name: string; current_amount_cents: number; interval: string; status: string }[]
  >("select id, name, current_amount_cents, interval, status from contracts where is_deleted = 0 and status not in ('ended', 'paused')");

  for (const contract of activeContracts) {
    const recent = await db.select<{ booking_date: string; amount_cents: number }[]>(
      "select booking_date, amount_cents from transactions where contract_id = $1 and is_deleted = 0 order by booking_date desc limit 1",
      [contract.id],
    );
    const latest = recent[0];
    if (!latest) continue;

    const deviates = Math.abs(latest.amount_cents - contract.current_amount_cents) > Math.abs(contract.current_amount_cents) * 0.05;
    if (deviates && contract.status !== "price_changed") {
      await db.execute(
        "update contracts set status = 'price_changed', previous_amount_cents = $1, current_amount_cents = $2 where id = $3",
        [contract.current_amount_cents, latest.amount_cents, contract.id],
      );
    }

    const expectedIntervalDays = contract.interval === "yearly" ? 365 : 30;
    const daysSinceLast = (Date.now() - new Date(latest.booking_date).getTime()) / 86_400_000;
    if (daysSinceLast > expectedIntervalDays * 2.5 && contract.status !== "ended") {
      await db.execute("update contracts set status = 'ended' where id = $1", [contract.id]);
    }
  }

  // Neue Muster aus noch nicht zugeordneten Transaktionen
  const candidates = await db.select<Candidate[]>(
    `select id, booking_date, amount_cents, counterparty, purpose from transactions
     where asset_id = $1 and is_deleted = 0 and is_transfer = 0
       and contract_id is null and recurring_payment_id is null
       and categorization_source != 'manual'`,
    [assetId],
  );

  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = normalize(c.counterparty);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const dismissedNames = new Set(
    (
      await db.select<{ name: string }[]>(
        "select name from contracts where is_dismissed = 1 union select name from recurring_payments where is_dismissed = 1",
      )
    ).map((r) => normalize(r.name)),
  );

  for (const [key, group] of groups) {
    if (group.length < 2 || dismissedNames.has(key)) continue;
    const amounts = group.map((g) => g.amount_cents);
    if (!amountsConsistent(amounts)) continue;

    const avgDays = averageIntervalDays(group.map((g) => g.booking_date));
    const intervalType = detectIntervalType(avgDays);
    const latest = [...group].sort((a, b) => (a.booking_date < b.booking_date ? 1 : -1))[0];
    const avgAmount = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);
    const displayName = group[0].counterparty.trim();
    const ids = group.map((g) => g.id);
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");

    if (intervalType !== "irregular") {
      const result = await db.execute(
        `insert into contracts (name, current_amount_cents, interval, status, detection_method)
         values ($1, $2, $3, 'detected', 'auto')`,
        [displayName, latest.amount_cents, intervalType],
      );
      const contractId = result.lastInsertId as number;
      await db.execute(`update transactions set contract_id = $1 where id in (${placeholders})`, [
        contractId,
        ...ids,
      ]);
    } else {
      const result = await db.execute(
        "insert into recurring_payments (name, typical_amount_cents) values ($1, $2)",
        [displayName, avgAmount],
      );
      const paymentId = result.lastInsertId as number;
      await db.execute(`update transactions set recurring_payment_id = $1 where id in (${placeholders})`, [
        paymentId,
        ...ids,
      ]);
    }
  }
}
