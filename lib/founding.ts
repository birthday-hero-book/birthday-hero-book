import { siteConfig } from "./site-config";

// The founding release is time-limited, so every surface that advertises it
// reads this one check. Once the deadline passes the site retires the offer by
// itself — no redeploy and no manual copy edit, which is what stops an expired
// deadline sitting on the homepage advertising urgency that no longer exists.
//
// Pages that render founding copy must also set a `revalidate` window, or the
// static HTML is frozen at build time and this check never gets to run again.
export function isFoundingOfferOpen(now: Date = new Date()): boolean {
  const deadline = Date.parse(siteConfig.foundingDeadlineISO);
  // Fail closed: if the deadline is ever unparseable we drop the offer rather
  // than advertise a date we cannot honour.
  if (Number.isNaN(deadline)) return false;
  return now.getTime() < deadline;
}
