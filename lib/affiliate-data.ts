import { getSupabaseServiceConfig } from "@/lib/supabase-config";
import { COMMISSION_STATUSES, type CommissionStatus } from "@/lib/commission";

// Server-only affiliate data access. Uses the raw service-role REST calls the
// rest of the app uses (orders route, referral capture) rather than an SDK, so
// the Data API stays locked to the service role with no browser-reachable
// policies. Only ever call these from server code (route handlers, server
// actions, server components) — never from a client component.

export { COMMISSION_STATUSES, type CommissionStatus } from "@/lib/commission";

export type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  auth_user_id: string | null;
  commission_rate: number;
  status: "active" | "paused";
  notes: string | null;
  created_at: string;
};

export type AttributedOrder = {
  id: string;
  package_id: string;
  commission_amount: number | null;
  commission_status: CommissionStatus;
  submitted_at: string;
};

// All money values are in whole pounds (matching siteConfig prices and the
// numeric(10,2) commission column).
export type CommissionTotals = {
  pending: number;
  approved: number;
  paid: number;
  reversed: number;
  owed: number; // pending + approved — the amount still to be paid out
};

export type AffiliateStats = {
  clicks: number;
  conversions: number; // attributed paid orders
  commission: CommissionTotals;
  orders: AttributedOrder[];
};

export type AffiliateWithStats = Affiliate & { stats: AffiliateStats };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Neutralise LIKE wildcards so an email lookup can't be turned into a pattern.
function escapeLike(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}

function serviceHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

// Total row count via PostgREST's exact count, without pulling the rows.
async function countRows(url: string, key: string, query: string): Promise<number> {
  try {
    const res = await fetch(`${url}/rest/v1/${query}`, {
      headers: { ...serviceHeaders(key), Prefer: "count=exact", Range: "0-0" },
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const total = res.headers.get("content-range")?.split("/")[1];
    const parsed = total ? Number(total) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function emptyTotals(): CommissionTotals {
  return { pending: 0, approved: 0, paid: 0, reversed: 0, owed: 0 };
}

// Sum in integer pence to avoid floating-point drift, then convert back.
function totalsFromOrders(orders: AttributedOrder[]): CommissionTotals {
  const pence = { pending: 0, approved: 0, paid: 0, reversed: 0, none: 0 };
  for (const order of orders) {
    const amount = Math.round(Number(order.commission_amount ?? 0) * 100);
    const bucket = (order.commission_status in pence ? order.commission_status : "none") as keyof typeof pence;
    pence[bucket] += amount;
  }
  const toGbp = (value: number) => Math.round(value) / 100;
  return {
    pending: toGbp(pence.pending),
    approved: toGbp(pence.approved),
    paid: toGbp(pence.paid),
    reversed: toGbp(pence.reversed),
    owed: toGbp(pence.pending + pence.approved),
  };
}

async function fetchAffiliate(filter: string): Promise<Affiliate | null> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/rest/v1/affiliates?select=*&${filter}&limit=1`, {
      headers: serviceHeaders(cfg.key),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return ((await res.json()) as Affiliate[])[0] ?? null;
  } catch {
    return null;
  }
}

// Affiliate emails are expected to be unique (the owner enters them); the lookup
// is case-insensitive so magic-link logins (which lower-case the email) match.
export async function getAffiliateByEmail(email: string): Promise<Affiliate | null> {
  return fetchAffiliate(`email=ilike.${encodeURIComponent(escapeLike(email))}`);
}

export async function getAffiliateByAuthUserId(authUserId: string): Promise<Affiliate | null> {
  if (!isUuid(authUserId)) return null;
  return fetchAffiliate(`auth_user_id=eq.${authUserId}`);
}

// Bind the Supabase Auth user to the affiliate row on first login (matched by
// the verified email). Only fills an empty slot, so an existing binding can't be
// silently reassigned.
export async function linkAuthUser(affiliateId: string, authUserId: string): Promise<void> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg || !isUuid(affiliateId) || !isUuid(authUserId)) return;
  try {
    await fetch(`${cfg.url}/rest/v1/affiliates?id=eq.${affiliateId}&auth_user_id=is.null`, {
      method: "PATCH",
      headers: { ...serviceHeaders(cfg.key), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ auth_user_id: authUserId }),
    });
  } catch {
    // Best effort; the dashboard still resolves the affiliate by email.
  }
}

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg || !isUuid(affiliateId)) {
    return { clicks: 0, conversions: 0, commission: emptyTotals(), orders: [] };
  }

  const [clicks, ordersRes] = await Promise.all([
    countRows(cfg.url, cfg.key, `affiliate_clicks?affiliate_id=eq.${affiliateId}&select=id`),
    fetch(
      `${cfg.url}/rest/v1/birthday_hero_orders?select=id,package_id,commission_amount,commission_status,submitted_at&affiliate_id=eq.${affiliateId}&order=submitted_at.desc`,
      { headers: serviceHeaders(cfg.key), cache: "no-store" },
    ),
  ]);

  const orders: AttributedOrder[] = ordersRes.ok ? await ordersRes.json() : [];
  return { clicks, conversions: orders.length, commission: totalsFromOrders(orders), orders };
}

export async function listAffiliates(): Promise<Affiliate[]> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg) return [];
  try {
    const res = await fetch(`${cfg.url}/rest/v1/affiliates?select=*&order=created_at.asc`, {
      headers: serviceHeaders(cfg.key),
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as Affiliate[]) : [];
  } catch {
    return [];
  }
}

export async function listAffiliatesWithStats(): Promise<AffiliateWithStats[]> {
  const affiliates = await listAffiliates();
  const stats = await Promise.all(affiliates.map((affiliate) => getAffiliateStats(affiliate.id)));
  return affiliates.map((affiliate, index) => ({ ...affiliate, stats: stats[index] }));
}

// Payout tracking: move a single order's commission between states (used for
// granular changes and reversals). Scoped to attributed orders only.
export async function setOrderCommissionStatus(orderId: string, status: CommissionStatus): Promise<boolean> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg || !isUuid(orderId) || !COMMISSION_STATUSES.includes(status)) return false;
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/birthday_hero_orders?id=eq.${orderId}&affiliate_id=not.is.null`,
      {
        method: "PATCH",
        headers: { ...serviceHeaders(cfg.key), "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ commission_status: status }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Payout tracking batch: advance every one of a partner's orders in `from` to
// `to` (e.g. approve all pending, or mark all approved as paid).
export async function bulkAdvanceCommissionForAffiliate(
  affiliateId: string,
  from: CommissionStatus,
  to: CommissionStatus,
): Promise<boolean> {
  const cfg = getSupabaseServiceConfig();
  if (!cfg || !isUuid(affiliateId) || !COMMISSION_STATUSES.includes(from) || !COMMISSION_STATUSES.includes(to)) {
    return false;
  }
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/birthday_hero_orders?affiliate_id=eq.${affiliateId}&commission_status=eq.${from}`,
      {
        method: "PATCH",
        headers: { ...serviceHeaders(cfg.key), "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ commission_status: to }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
