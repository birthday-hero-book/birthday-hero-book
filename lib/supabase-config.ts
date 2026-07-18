// Shared Supabase connection settings. Kept free of any `next/headers` import so
// it is safe to use from edge middleware as well as from route handlers and
// server components.

// Publishable (anon) key — used only by the auth/session layer (@supabase/ssr).
// The key is designed to be public, but every auth interaction here is
// server-rendered, so we keep it server-only.
export function getSupabaseAuthConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Service-role key — server-only data access, matching the orders route and the
// referral capture. Never reaches the browser.
export function getSupabaseServiceConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}
