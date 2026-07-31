import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

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

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Still reject malformed bodies even though nothing is read out of the event
  // yet, so a signed-but-broken payload is not answered with a cheerful 200.
  try {
    JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // This endpoint used to check, right here, whether a paid session already had
  // a personalisation record and email the owner if not. It fired on every
  // single order: checkout.session.completed arrives the moment payment
  // succeeds, while the customer still has a ~3-minute form ahead of them, so a
  // matching row could never exist yet. Measured in the 2026-07-31 test-mode dry
  // run — false alarm at 14:12, genuine order alert at 14:18.
  //
  // Deciding a customer has abandoned the form needs elapsed time, which a
  // webhook cannot wait for. That check now lives in /api/reconcile-orders,
  // which runs on a schedule and only considers payments old enough to judge.
  //
  // The endpoint is kept — signature-verified and acknowledging — because it
  // stays the natural place to finalise orders if the form-first checkout is
  // ever built, and because removing it would mean reconfiguring Stripe.
  return NextResponse.json({ received: true });
}
