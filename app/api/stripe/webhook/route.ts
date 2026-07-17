import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

const SIGNATURE_TOLERANCE_SECONDS = 300;

// Verify Stripe's signature manually (the project avoids the Stripe SDK).
// Header format: "t=<timestamp>,v1=<hex hmac of `${t}.${rawBody}`>".
function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((pair) => pair.split("=", 2)));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// A paid Checkout Session with no matching order means the customer paid but did
// not complete the personalisation form — so the book can't be made yet. Alert
// the owner to follow up. (No children's details are involved.)
async function alertAbandonedPaidOrder(sessionId: string, referralCode: string | null): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();
  const to = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || siteConfig.contactEmail;
  if (!apiKey || !from || !to) return;

  const shortReference = sessionId.slice(-8).toUpperCase();
  const referralLine = referralCode ? `\nReferral: ${referralCode}` : "";
  const text = [
    "A Stripe payment completed, but no personalisation form has been submitted for it yet.",
    "The customer may have closed the browser before finishing. Follow up with them to collect the details before the book can be created.",
    "",
    `Stripe session: ${sessionId}${referralLine}`,
    "",
    "If the customer already completed the form, no action is needed.",
  ].join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `abandoned-paid-${sessionId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Paid order needs personalisation details — ${shortReference}`,
        text,
        tags: [{ name: "category", value: "abandoned_paid" }],
      }),
    });
  } catch {
    // best effort
  }
}

async function handlePaidSession(sessionId: string, referralCode: string | null): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseSecretKey) return;

  try {
    const existing = await fetch(
      `${supabaseUrl}/rest/v1/birthday_hero_orders?select=id&stripe_session_id=eq.${encodeURIComponent(sessionId)}`,
      { headers: { apikey: supabaseSecretKey, Authorization: `Bearer ${supabaseSecretKey}` }, cache: "no-store" },
    );
    const rows = existing.ok ? ((await existing.json()) as Array<{ id: string }>) : [];
    if (rows.length > 0) return; // The personalisation form already recorded this order.

    await alertAbandonedPaidOrder(sessionId, referralCode);
  } catch {
    // best effort — never fail the webhook on a follow-up alert
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object as { id?: string; payment_status?: string; client_reference_id?: string | null } | undefined;
    if (session?.id && session.payment_status === "paid") {
      await handlePaidSession(session.id, session.client_reference_id ?? null);
    }
  }

  // Acknowledge quickly so Stripe does not retry; processing is best-effort.
  return NextResponse.json({ received: true });
}
