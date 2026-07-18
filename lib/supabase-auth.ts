import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAuthConfig } from "@/lib/supabase-config";

// Auth/session layer for the partner + admin dashboards. This is the ONE place
// the project leans on the Supabase SDK: magic-link code exchange, session
// cookies and token refresh are security-sensitive plumbing best handled by a
// vetted library. All *data* access elsewhere stays raw service-role fetch.

// Server client for Server Components, Route Handlers and Server Actions.
// In a Server Component cookies cannot be written, so setAll is a no-op there
// and the middleware refreshes the session instead.
export async function createSupabaseServerClient() {
  const config = getSupabaseAuthConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — the middleware handles refresh.
        }
      },
    },
  });
}

export type AuthUser = { id: string; email: string };

// The verified, authenticated user (validated against the Auth server), or null.
// Always use this — never getSession — for access decisions.
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email.toLowerCase() };
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
