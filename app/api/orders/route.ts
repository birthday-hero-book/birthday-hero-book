import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export const runtime = "nodejs";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

function storageObjectUrl(baseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
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
    const permissionConfirmed = isChecked(formData, "permission");
    const privacyAcknowledged = isChecked(formData, "privacyAcknowledged");

    if (!packageId || !siteConfig.packages.some((item) => item.id === packageId)) throw new Error("Please choose a valid edition.");
    if (!stripeSessionId || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(stripeSessionId)) throw new Error("We could not confirm the Stripe payment reference.");
    if (!siteConfig.themes.some((item) => item.id === theme)) throw new Error("Please choose a valid adventure.");
    if (!Number.isInteger(age) || age < 3 || age > 10) throw new Error("Please choose an age from 3 to 10.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
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

    const order = {
      id: orderId,
      package_id: packageId,
      stripe_session_id: stripeSessionId,
      stripe_payment_link_id: stripeSession.payment_link,
      stripe_payment_status: stripeSession.payment_status,
      purchaser_name: readText(formData, "purchaserName", 120, true),
      purchaser_email: email,
      child_first_name: readText(formData, "childFirstName", 24, true),
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

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not save the order details.";
    return NextResponse.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
