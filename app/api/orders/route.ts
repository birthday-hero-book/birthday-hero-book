import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { REFERRAL_CODE_PATTERN, REFERRAL_COOKIE } from "@/lib/consent";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

type OrderNotificationStatus = "sent" | "skipped" | "failed";

type NotificationOrder = {
  id: string;
  packageId: string;
  purchaserName: string;
  purchaserEmail: string;
  themeId: string;
};

function readText(formData: FormData, key: string, maxLength: number, required = false) {
  const value = String(formData.get(key) || "").trim();
  if (required && !value) throw new Error(`Please complete ${key}.`);
  if (value.length > maxLength) throw new Error(`${key} is too long.`);
  return value || null;
}

function isChecked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function storageObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

async function sendOrderNotification(order: NotificationOrder): Promise<OrderNotificationStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();
  const to = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || siteConfig.contactEmail;

  if (!apiKey || !from || !to) return "skipped";

  const selectedPackage = siteConfig.packages.find((item) => item.id === order.packageId);
  const selectedTheme = siteConfig.themes.find((item) => item.id === order.themeId);
  const edition = selectedPackage?.name || order.packageId;
  const theme = selectedTheme?.name || order.themeId;
  const shortReference = order.id.slice(0, 8).toUpperCase();
  const subject = `New ${edition} order — ${shortReference}`;
  const text = [
    "A paid Birthday Hero Book personalisation form has been submitted.",
    "",
    `Edition: ${edition}`,
    `Order reference: ${order.id}`,
    `Purchaser: ${order.purchaserName}`,
    `Purchaser email: ${order.purchaserEmail}`,
    `Adventure: ${theme}`,
    "",
    "The child's personalisation details and any optional photograph are stored securely in Supabase. Open the order there to fulfil it.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181714;max-width:620px;margin:0 auto">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#ff5a3d;margin:0 0 12px">New paid order</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 24px">${escapeHtml(edition)} · ${escapeHtml(shortReference)}</h1>
      <table style="border-collapse:collapse;width:100%;font-size:16px">
        <tr><td style="padding:10px 0;color:#6b6860">Order reference</td><td style="padding:10px 0;font-weight:700">${escapeHtml(order.id)}</td></tr>
        <tr><td style="padding:10px 0;color:#6b6860">Purchaser</td><td style="padding:10px 0;font-weight:700">${escapeHtml(order.purchaserName)}</td></tr>
        <tr><td style="padding:10px 0;color:#6b6860">Email</td><td style="padding:10px 0;font-weight:700"><a href="mailto:${escapeHtml(order.purchaserEmail)}" style="color:#181714">${escapeHtml(order.purchaserEmail)}</a></td></tr>
        <tr><td style="padding:10px 0;color:#6b6860">Adventure</td><td style="padding:10px 0;font-weight:700">${escapeHtml(theme)}</td></tr>
      </table>
      <p style="margin:24px 0 0;padding:16px;background:#f5f0e7;border-radius:12px;color:#59564f">The child’s personalisation details and any optional photograph are stored securely in Supabase.</p>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-notification-${order.id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: order.purchaserEmail,
        subject,
        html,
        text,
        tags: [{ name: "category", value: "new_order" }],
      }),
    });

    if (!response.ok) {
      console.error("Order notification failed.", { orderId: order.id, status: response.status });
      return "failed";
    }

    return "sent";
  } catch {
    console.error("Order notification failed.", { orderId: order.id });
    return "failed";
  }
}

async function sendCustomerConfirmation(order: NotificationOrder): Promise<OrderNotificationStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();

  if (!apiKey || !from) return "skipped";

  const selectedPackage = siteConfig.packages.find((item) => item.id === order.packageId);
  const edition = selectedPackage?.name || order.packageId;
  const shortReference = order.id.slice(0, 8).toUpperCase();
  const subject = `Your Birthday Hero Book order is confirmed — ${shortReference}`;
  const text = [
    `Hi ${order.purchaserName},`,
    "",
    "Thank you — your payment and personalisation details have been received securely.",
    "Our illustrators will now carefully create the adventure and email your finished book within five working days.",
    "",
    `Edition: ${edition}`,
    `Order reference: ${shortReference}`,
    "",
    "For your child's privacy, we don't repeat their personalisation details in this email. They are stored securely and used only to create the book.",
    "",
    `Questions? Just reply to this email or contact ${siteConfig.contactEmail}.`,
    "",
    "With love,",
    "Birthday Hero Book",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181714;max-width:620px;margin:0 auto">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#ff5a3d;margin:0 0 12px">Order confirmed</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 18px">Thank you, ${escapeHtml(order.purchaserName)}.</h1>
      <p style="font-size:16px;margin:0 0 18px">Your payment and personalisation details have been received securely. Our illustrators will now carefully create the adventure and email your finished book <strong>within five working days</strong>.</p>
      <table style="border-collapse:collapse;width:100%;font-size:16px;margin:0 0 6px">
        <tr><td style="padding:10px 0;color:#6b6860">Edition</td><td style="padding:10px 0;font-weight:700">${escapeHtml(edition)}</td></tr>
        <tr><td style="padding:10px 0;color:#6b6860">Order reference</td><td style="padding:10px 0;font-weight:700">${escapeHtml(shortReference)}</td></tr>
      </table>
      <p style="margin:22px 0;padding:16px;background:#f5f0e7;border-radius:12px;color:#59564f;font-size:14px">For your child’s privacy, we don’t repeat their personalisation details in this email. They are stored securely and used only to create the book.</p>
      <p style="font-size:14px;color:#59564f;margin:0">Questions? Just reply to this email or contact <a href="mailto:${escapeHtml(siteConfig.contactEmail)}" style="color:#181714">${escapeHtml(siteConfig.contactEmail)}</a>.</p>
      <p style="font-size:14px;color:#59564f;margin:18px 0 0">With love,<br />Birthday Hero Book</p>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-confirmation-${order.id}`,
      },
      body: JSON.stringify({
        from,
        to: [order.purchaserEmail],
        reply_to: siteConfig.contactEmail,
        subject,
        html,
        text,
        tags: [{ name: "category", value: "order_confirmation" }],
      }),
    });

    if (!response.ok) {
      console.error("Customer confirmation failed.", { orderId: order.id, status: response.status });
      return "failed";
    }

    return "sent";
  } catch {
    console.error("Customer confirmation failed.", { orderId: order.id });
    return "failed";
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const photoBucket = process.env.SUPABASE_ORDER_BUCKET || "order-photos";
  const stripeApiKey = process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey || !stripeApiKey) {
    return NextResponse.json({ error: "Secure order storage and payment verification are not configured yet." }, { status: 503 });
  }

  try {
    const formData = await request.formData();

    // Quiet honeypot: real customers never see or complete this field.
    if (readText(formData, "website", 200)) {
      return NextResponse.json({ ok: true });
    }

    const packageId = readText(formData, "package", 20, true);
    const stripeSessionId = readText(formData, "stripeSessionId", 255, true);
    const theme = readText(formData, "theme", 30, true);
    const age = Number(readText(formData, "age", 2, true));
    const email = readText(formData, "email", 254, true);
    const purchaserName = readText(formData, "purchaserName", 120, true);
    const childFirstName = readText(formData, "childFirstName", 24, true);
    const permissionConfirmed = isChecked(formData, "permission");
    const privacyAcknowledged = isChecked(formData, "privacyAcknowledged");

    if (!packageId || !siteConfig.packages.some((item) => item.id === packageId)) throw new Error("Please choose a valid edition.");
    if (!stripeSessionId || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(stripeSessionId)) throw new Error("We could not confirm the Stripe payment reference.");
    if (!theme || !siteConfig.themes.some((item) => item.id === theme)) throw new Error("Please choose a valid adventure.");
    if (!Number.isInteger(age) || age < 3 || age > 10) throw new Error("Please choose an age from 3 to 10.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
    if (!purchaserName || !childFirstName) throw new Error("Please complete the purchaser and birthday hero details.");
    if (!permissionConfirmed || !privacyAcknowledged) throw new Error("Permission and privacy confirmation are required.");

    const expectedPaymentLink = process.env[`STRIPE_${packageId.toUpperCase()}_PAYMENT_LINK_ID`];
    if (!expectedPaymentLink) throw new Error("Payment verification is not configured for this edition.");

    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(stripeSessionId)}`, {
      headers: { Authorization: `Bearer ${stripeApiKey}` },
      cache: "no-store",
    });
    if (!stripeResponse.ok) throw new Error("We could not verify this Stripe payment. Please contact us if you have already paid.");
    const stripeSession = await stripeResponse.json() as { payment_link?: string | null; payment_status?: string; status?: string };
    if (stripeSession.status !== "complete" || stripeSession.payment_status !== "paid" || stripeSession.payment_link !== expectedPaymentLink) {
      throw new Error("This payment is not complete or does not match the selected edition.");
    }

    const photoEntry = formData.get("photo");
    const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;
    if (photo && (!ALLOWED_PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_BYTES)) {
      throw new Error("The optional photo must be a JPG, PNG or WebP no larger than 5MB.");
    }

    const orderId = crypto.randomUUID();
    let photoPath: string | null = null;

    if (photo) {
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "photo";
      photoPath = `${orderId}/${Date.now()}-${safeName}`;
      const uploadResponse = await fetch(storageObjectUrl(supabaseUrl, photoBucket, photoPath), {
        method: "POST",
        headers: {
          apikey: supabaseSecretKey,
          "Content-Type": photo.type,
          "x-upsert": "false",
        },
        body: Buffer.from(await photo.arrayBuffer()),
      });
      if (!uploadResponse.ok) throw new Error("The optional photograph could not be stored securely. Please try again.");
    }

    // Affiliate attribution: if the visitor arrived via a partner referral link
    // (and accepted marketing cookies), credit this paid order and record commission.
    const referralCode = readCookie(request.headers.get("cookie"), REFERRAL_COOKIE);
    let attribution: { affiliate_id: string; commission_amount: number; commission_status: string } | null = null;
    if (referralCode && REFERRAL_CODE_PATTERN.test(referralCode)) {
      try {
        const lookup = await fetch(
          `${supabaseUrl}/rest/v1/affiliates?select=id,commission_rate&status=eq.active&code=ilike.${encodeURIComponent(referralCode)}`,
          { headers: { apikey: supabaseSecretKey, Authorization: `Bearer ${supabaseSecretKey}` }, cache: "no-store" },
        );
        if (lookup.ok) {
          const affiliate = ((await lookup.json()) as Array<{ id: string; commission_rate: number }>)[0];
          if (affiliate) {
            const price = siteConfig.packages.find((item) => item.id === packageId)?.price ?? 0;
            attribution = {
              affiliate_id: affiliate.id,
              commission_amount: Math.round(price * Number(affiliate.commission_rate) * 100) / 100,
              commission_status: "pending",
            };
          }
        }
      } catch {
        // Attribution is best-effort; never block a paid order on it.
      }
    }

    const order = {
      id: orderId,
      package_id: packageId,
      stripe_session_id: stripeSessionId,
      stripe_payment_link_id: stripeSession.payment_link,
      stripe_payment_status: stripeSession.payment_status,
      purchaser_name: purchaserName,
      purchaser_email: email,
      child_first_name: childFirstName,
      child_age: age,
      appearance: readText(formData, "appearance", 2000, true),
      theme_id: theme,
      interests: readText(formData, "interests", 2000, true),
      favourite_colour: readText(formData, "favouriteColour", 100, true),
      pet: readText(formData, "pet", 500),
      family_members: readText(formData, "family", 1500),
      details_to_avoid: readText(formData, "avoid", 1500),
      dedication: readText(formData, "dedication", 1500, true),
      permission_confirmed: permissionConfirmed,
      privacy_acknowledged: privacyAcknowledged,
      marketing_consent: isChecked(formData, "marketingConsent"),
      photo_path: photoPath,
      photo_mime: photo?.type || null,
      ...(attribution ?? {}),
      status: "received",
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/birthday_hero_orders`, {
      method: "POST",
      headers: {
        apikey: supabaseSecretKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(order),
    });

    if (!insertResponse.ok) {
      if (photoPath) {
        await fetch(storageObjectUrl(supabaseUrl, photoBucket, photoPath), {
          method: "DELETE",
          headers: { apikey: supabaseSecretKey },
        });
      }
      throw new Error("We could not save the order details. Please contact us if you have already paid.");
    }

    const emailOrder: NotificationOrder = {
      id: orderId,
      packageId,
      purchaserName,
      purchaserEmail: email,
      themeId: theme,
    };
    const [staffAlert, customerConfirmation] = await Promise.all([
      sendOrderNotification(emailOrder),
      sendCustomerConfirmation(emailOrder),
    ]);

    return NextResponse.json({ ok: true, notifications: { staffAlert, customerConfirmation } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not save the order details.";
    return NextResponse.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
