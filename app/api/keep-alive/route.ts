import { NextResponse } from "next/server";
import { getSupabaseServiceConfig } from "@/lib/supabase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stops the Supabase Free-plan project from auto-pausing after ~7 days of
// inactivity. A daily Vercel cron (see vercel.json) calls this route, which runs
// one trivial database read. The read has to hit the database — Supabase's pause
// timer watches database activity, so pinging a non-DB endpoint would not count.
//
// Auth: Vercel automatically sends CRON_SECRET as a Bearer token on cron
// invocations when that env var is set. If CRON_SECRET is set we require it, so
// nobody else can trigger the route; if it is not set the route still runs, so
// the keep-alive works the moment this deploys, before the secret is added.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const cfg = getSupabaseServiceConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "supabase-not-configured" }, { status: 500 });
  }

  try {
    // Smallest possible touch of the database: ask PostgREST for at most one id.
    const res = await fetch(`${cfg.url}/rest/v1/birthday_hero_orders?select=id&limit=1`, {
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `supabase-${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, pinged: "birthday_hero_orders" });
  } catch {
    return NextResponse.json({ ok: false, error: "supabase-unreachable" }, { status: 502 });
  }
}
