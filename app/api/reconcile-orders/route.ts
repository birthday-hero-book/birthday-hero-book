import { NextResponse } from "next/server";
import { getSupabaseServiceConfig } from "@/lib/supabase-config";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Finds payments that never became orders: someone paid, then closed the browser
// before finishing the personalisation form, so there are no details to make the
// book from. The owner needs to know so they can chase it.
//
// This used to live in the Stripe webhook, where it was worthless — see the note
// in app/api/stripe/webhook/route.ts. Judging abandonment needs elapsed time, so
// it belongs on a schedule instead.
//
// SWEEP_WINDOW_HOURS must match the cron interval in vercel.json. Together with
// the grace period it tiles the timeline into non-overlapping windows, so each
// payment is examined by exactly one run and cannot be reported twice — which is
// what lets this work without storing any "already alerted" state. Change the
// cron schedule without changing this and payments get either double-reported or
// skipped entirely.
const SWEEP_WINDOW_HOURS = 1;

// How long a customer gets to fill the form in before silence counts as
// abandonment. The form takes about three minutes; an hour is generous enough
// that nobody mid-purchase is ever reported.
const GRACE_PERIOD_HOURS = 1;

// Realistic volume is a handful of orders a day, so this is a runaway guard
// rather than a real limit. If it ever trips, the run says so out loud instead
// of silently reporting on a partial picture.
const MAX_STRIPE_PAGES = 5;

type PaidSession = {
  id: string;
  created: number;
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
};

async function listPaidSessions(stripeApiKey: string, fromUnix: number, toUnix: number) {
  const sessions: PaidSession[] = [];
  let startingAfter: string | null = null;
  let truncated = false;

  for (let page = 0; page < MAX_STRIPE_PAGES; page += 1) {
    // Half-open [from, to): lt rather than lte. With an inclusive upper bound a
    // payment created exactly on a window boundary would fall into two
    // consecutive runs and be reported twice.
    const query = new URLSearchParams({
      "created[gte]": String(fromUnix),
      "created[lt]": String(toUnix),
      limit: "100",
    });
    if (startingAfter) query.set("starting_after", startingAfter);

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?${query}`, {
      headers: { Authorization: `Bearer ${stripeApiKey}` },
      cache: "no-store",
    });
    if (!response.ok) {
      // A restricted key without list access to Checkout Sessions lands here.
      throw new Error(`Stripe returned ${response.status} listing checkout sessions.`);
    }

    const body = (await response.json()) as { data?: Array<PaidSession & { status?: string; payment_status?: string }>; has_more?: boolean };
    const batch = body.data ?? [];
    for (const session of batch) {
      if (session.status === "complete" && session.payment_status === "paid") {
        sessions.push(session);
      }
    }

    if (!body.has_more || batch.length === 0) return { sessions, truncated };
    startingAfter = batch[batch.length - 1].id;
    truncated = true;
  }

  return { sessions, truncated };
}

async function findRecordedSessionIds(
  supabaseUrl: string,
  supabaseSecretKey: string,
  sessionIds: string[],
): Promise<Set<string>> {
  // Checkout Session ids are strictly cs_ plus alphanumerics, so anything else
  // is not a real session and is dropped rather than interpolated into a URL.
  const safeIds = sessionIds.filter((id) => /^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(id));
  if (safeIds.length !== sessionIds.length) {
    console.warn("Dropped unexpected Stripe session id formats before the lookup.", { dropped: sessionIds.length - safeIds.length });
  }
  if (safeIds.length === 0) return new Set();

  // One eq. query per session rather than a single in.() list. A batched filter
  // would be tidier, but no query in this codebase uses in.() and none of it can
  // be tried against the real database from here — whereas this exact query
  // shape ran in the Stripe webhook in production for weeks. At a handful of
  // orders a day the extra round trips cost nothing, and being certain the
  // filter parses is worth more: a lookup that silently matched nothing would
  // report every completed order as abandoned, which is the very bug being
  // fixed.
  const results = await Promise.all(
    safeIds.map(async (id) => {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/birthday_hero_orders?select=stripe_session_id&stripe_session_id=eq.${encodeURIComponent(id)}`,
        { headers: { apikey: supabaseSecretKey, Authorization: `Bearer ${supabaseSecretKey}` }, cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(`Supabase returned ${response.status} looking up recorded orders.`);
      }
      const rows = (await response.json()) as Array<{ stripe_session_id: string }>;
      return rows.length > 0 ? id : null;
    }),
  );

  return new Set(results.filter((id): id is string => id !== null));
}

function formatAmount(session: PaidSession) {
  if (session.amount_total === null || session.amount_total === undefined) return "unknown amount";
  const symbol = session.currency?.toLowerCase() === "gbp" ? "£" : `${(session.currency || "").toUpperCase()} `;
  return `${symbol}${(session.amount_total / 100).toFixed(2)}`;
}

async function alertAbandonedPaidOrders(sessions: PaidSession[], windowStartUnix: number): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();
  const to = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || siteConfig.contactEmail;

  if (!apiKey || !from || !to) {
    console.error("Abandoned-order alert skipped — email is not configured.", {
      missing: [!apiKey && "RESEND_API_KEY", !from && "ORDER_NOTIFICATION_FROM", !to && "ORDER_NOTIFICATION_EMAIL"].filter(Boolean),
    });
    return "skipped";
  }

  const count = sessions.length;
  const subject =
    count === 1
      ? `Paid order needs personalisation details — ${sessions[0].id.slice(-8).toUpperCase()}`
      : `${count} paid orders need personalisation details`;

  const lines = sessions.map((session) => {
    const email = session.customer_details?.email || "no email on the payment";
    const paidAt = new Date(session.created * 1000).toISOString().replace("T", " ").slice(0, 16);
    return [`• ${formatAmount(session)} — ${email}`, `  Paid: ${paidAt} UTC`, `  Stripe session: ${session.id}`].join("\n");
  });

  const text = [
    count === 1
      ? "A Stripe payment completed, but no personalisation form was ever submitted for it."
      : `${count} Stripe payments completed, but no personalisation form was ever submitted for them.`,
    "The customer most likely closed the browser before finishing. Their book cannot be made until you collect the details, so follow up using the email address below.",
    "",
    ...lines,
    "",
    `Checked payments between ${GRACE_PERIOD_HOURS} and ${GRACE_PERIOD_HOURS + SWEEP_WINDOW_HOURS} hours old.`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // One alert per sweep window, which is exactly the semantic wanted: a
        // re-run covering the same window cannot produce a second email. Keying
        // on the session list instead would risk collisions once truncated to a
        // legal header length.
        "Idempotency-Key": `abandoned-paid-${windowStartUnix}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        tags: [{ name: "category", value: "abandoned_paid" }],
      }),
    });
    if (!response.ok) {
      console.error("Abandoned-order alert failed to send.", { status: response.status });
      return "failed";
    }
    return "sent";
  } catch {
    console.error("Abandoned-order alert failed to send.");
    return "failed";
  }
}

export async function GET(request: Request) {
  // Same guard as /api/keep-alive: Vercel sends CRON_SECRET as a Bearer token on
  // cron invocations, and if the secret is set we require it.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceConfig();
  const stripeApiKey = process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY;
  if (!supabase || !stripeApiKey) {
    return NextResponse.json({ ok: false, error: "not-configured" }, { status: 503 });
  }

  // Anchor the window to the clock hour rather than to "now". Cron firing times
  // drift by a minute or two, and at hourly frequency a window measured from the
  // actual start time would drift with them — leaving a sliver double-reported
  // or skipped between consecutive runs. Flooring makes every run compute the
  // same span it would have computed had it fired exactly on time.
  const HOUR_SECONDS = 3600;
  const hourStartUnix = Math.floor(Date.now() / 1000 / HOUR_SECONDS) * HOUR_SECONDS;
  const toUnix = hourStartUnix - GRACE_PERIOD_HOURS * HOUR_SECONDS;
  const fromUnix = toUnix - SWEEP_WINDOW_HOURS * HOUR_SECONDS;

  try {
    const { sessions, truncated } = await listPaidSessions(stripeApiKey, fromUnix, toUnix);
    if (truncated) {
      console.warn("Reconciliation hit the Stripe pagination cap; some payments in this window were not checked.", { fromUnix, toUnix });
    }
    if (sessions.length === 0) {
      return NextResponse.json({ ok: true, paid: 0, abandoned: 0, alert: "not-needed" });
    }

    const recorded = await findRecordedSessionIds(supabase.url, supabase.key, sessions.map((session) => session.id));
    const abandoned = sessions.filter((session) => !recorded.has(session.id));

    if (abandoned.length === 0) {
      return NextResponse.json({ ok: true, paid: sessions.length, abandoned: 0, alert: "not-needed" });
    }

    console.warn("Paid payments with no personalisation form.", { count: abandoned.length, sessionIds: abandoned.map((session) => session.id) });
    const alert = await alertAbandonedPaidOrders(abandoned, fromUnix);

    return NextResponse.json({ ok: true, paid: sessions.length, abandoned: abandoned.length, alert, truncated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reconciliation failed.";
    console.error("Order reconciliation failed.", { message });
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
