// First-party cookie-consent state. No third-party CMP; the site stores the
// visitor's choice in a first-party cookie and only loads Google Analytics
// after analytics consent is granted (UK GDPR + PECR: no non-essential
// cookies before opt-in, and rejecting must be as easy as accepting).

export const CONSENT_COOKIE = "bhb_consent";
// Bump when the cookie categories change — invalidates old choices and re-asks.
export const CONSENT_VERSION = 2;
export const CONSENT_MAX_AGE_DAYS = 180;

// First-party referral-attribution cookie. Only set with marketing consent.
export const REFERRAL_COOKIE = "bhb_ref";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export type ConsentRecord = {
  version: number;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function readConsent(): ConsentRecord | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1))) as Partial<ConsentRecord>;
    if (parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return { version: CONSENT_VERSION, analytics: parsed.analytics, marketing: parsed.marketing, updatedAt: parsed.updatedAt ?? "" };
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean, marketing: boolean): ConsentRecord {
  const record: ConsentRecord = { version: CONSENT_VERSION, analytics, marketing, updatedAt: new Date().toISOString() };
  if (typeof document !== "undefined") {
    const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  }
  return record;
}

export function clearReferralCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${REFERRAL_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

// Best-effort removal of Google Analytics cookies when analytics is withdrawn.
export function clearAnalyticsCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie
    .split("; ")
    .map((row) => row.split("=")[0])
    .filter((name) => name === "_ga" || name === "_gid" || name === "_gat" || name.startsWith("_ga_"));
  const host = window.location.hostname;
  const rootDomain = host.split(".").slice(-2).join(".");
  for (const name of names) {
    for (const domain of ["", `; Domain=${host}`, `; Domain=.${rootDomain}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax`;
    }
  }
}
