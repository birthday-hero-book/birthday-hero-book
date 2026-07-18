import { headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";

// The origin of the current request, used to build absolute URLs (magic-link
// redirect targets, a partner's referral link) that work on localhost, Vercel
// previews and production alike.
export async function getRequestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : `https://${siteConfig.domain}`;
}
