import { NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase-auth";
import { getAffiliateByEmail, linkAuthUser } from "@/lib/affiliate-data";

export const runtime = "nodejs";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "";
}

// The magic link lands here with a one-time code. Exchange it for a session,
// bind the auth user to the partner row on first login, then send them on to the
// right place. Any failure returns to the sign-in page with a friendly message.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/partners?error=link", origin));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/partners?error=config", origin));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/partners?error=link", origin));
  }

  const email = data.user.email.toLowerCase();

  // First login: attach this verified account to the matching partner row.
  const affiliate = await getAffiliateByEmail(email);
  if (affiliate && !affiliate.auth_user_id) {
    await linkAuthUser(affiliate.id, data.user.id);
  }

  const target = next || (isAdminEmail(email) ? "/admin" : "/partners/dashboard");
  return NextResponse.redirect(new URL(target, origin));
}
