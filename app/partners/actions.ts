"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, isAdminEmail } from "@/lib/supabase-auth";
import { getAffiliateByEmail } from "@/lib/affiliate-data";
import { getRequestOrigin } from "@/lib/request-origin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

// Email the visitor a magic sign-in link — but only if the address belongs to a
// known partner or an admin. Everyone sees the same "check your email" screen
// regardless, so this neither spams links to strangers nor reveals who is
// registered.
export async function requestMagicLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    redirect(`/partners?error=invalid${nextQuery}`);
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const isKnown = isAdminEmail(email) || Boolean(await getAffiliateByEmail(email));
    if (isKnown) {
      try {
        const origin = await getRequestOrigin();
        const emailRedirectTo = `${origin}/partners/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
        await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } });
      } catch {
        // Never surface send failures — the neutral confirmation still shows.
      }
    }
  }

  redirect("/partners?sent=1");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore — clearing the cookie client-side on redirect is enough.
    }
  }
  redirect("/partners");
}
