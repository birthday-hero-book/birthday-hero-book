import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { CONSENT_COOKIE, REFERRAL_CODE_PATTERN, REFERRAL_COOKIE, REFERRAL_MAX_AGE_DAYS } from "@/lib/consent";

export const runtime = "nodejs";

function hasMarketingConsent(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.split("; ").find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1))) as { marketing?: boolean };
    return parsed.marketing === true;
  } catch {
    return false;
  }
}

// Partner referral entry point: birthdayherobook.com/r/<CODE>. Logs the click,
// then redirects in. The attribution cookie is only set once the visitor has
// accepted marketing cookies; until then the code is carried in ?ref= so the
// client can store it after consent.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origin = new URL(request.url).origin;

  if (!REFERRAL_CODE_PATTERN.test(code)) {
    return NextResponse.redirect(new URL("/", origin), { status: 302 });
  }

  // Only allow same-origin internal redirect targets.
  const toParam = new URL(request.url).searchParams.get("to");
  const destination = toParam && toParam.startsWith("/") && !toParam.startsWith("//")
    ? new URL(toParam, origin)
    : new URL("/", origin);

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate the code and log the click — never let this block the redirect.
  if (supabaseUrl && supabaseSecretKey) {
    try {
      const authHeaders = { apikey: supabaseSecretKey, Authorization: `Bearer ${supabaseSecretKey}` };
      const lookup = await fetch(
        `${supabaseUrl}/rest/v1/affiliates?select=id&status=eq.active&code=ilike.${encodeURIComponent(code)}`,
        { headers: authHeaders, cache: "no-store" },
      );
      const affiliateId = lookup.ok ? ((await lookup.json()) as Array<{ id: string }>)[0]?.id ?? null : null;

      if (affiliateId) {
        const url = new URL(request.url);
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const salt = process.env.REFERRAL_IP_SALT ?? "";
        await fetch(`${supabaseUrl}/rest/v1/affiliate_clicks`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            affiliate_id: affiliateId,
            landing_path: destination.pathname,
            referrer: request.headers.get("referer"),
            utm_source: url.searchParams.get("utm_source"),
            utm_medium: url.searchParams.get("utm_medium"),
            utm_campaign: url.searchParams.get("utm_campaign"),
            ip_hash: ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null,
            user_agent: request.headers.get("user-agent"),
          }),
        });
      }
    } catch {
      // Ignore lookup/logging failures; attribution can still happen at checkout.
    }
  }

  if (!hasMarketingConsent(request.headers.get("cookie"))) {
    destination.searchParams.set("ref", code);
    return NextResponse.redirect(destination, { status: 302 });
  }

  const response = NextResponse.redirect(destination, { status: 302 });
  response.cookies.set(REFERRAL_COOKIE, code, {
    maxAge: REFERRAL_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
