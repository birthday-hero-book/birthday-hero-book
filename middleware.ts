import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthConfig } from "@/lib/supabase-config";

// Refresh the Supabase session on the dashboard routes so Server Components can
// read an up-to-date session (expired access tokens are rotated into cookies
// here). Scoped tightly to the partner + admin areas; the marketing site is
// untouched.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseAuthConfig();
  if (!config) return response;

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touch the session so an expired access token is refreshed before the route
  // renders. Do not gate access here — pages do their own checks.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/partners/:path*", "/admin/:path*"],
};
