import { siteConfig } from "./site-config";

// The one switch for whether the shop is taking new orders. Every surface that
// could start — or finish — a purchase reads this: the pricing CTAs, the
// personalisation form, the order API, the sitemap and robots. Reopening is a
// single edit here rather than a hunt through the components.
//
// A constant rather than an env var on purpose. NEXT_PUBLIC_ values are inlined
// at build time (see lib/site-config.ts), so an env var would still need a
// redeploy to take effect — and an env var that is simply missing would fail
// OPEN, quietly putting the shop back on sale. This fails closed.
// Typed as boolean, not inferred as the literal `false`, so flipping it back
// does not change the type and no branch here is ever dead code to the compiler.
export const ORDERS_OPEN: boolean = false;

// Copy for the closed state, kept beside the switch so it retires with it.
export const waitlist = {
  badge: "Fully booked",
  kicker: "Currently fully booked",
  heading: "The studio is at capacity.",
  intro: "Every book is illustrated and written to order, one at a time. We’ve taken on as many birthdays as we can do justice to, so new commissions are paused while we work through the queue.",
  strip: "New orders are closed for now. Join the waitlist and we’ll email you first when places open — it’s free and there’s no obligation.",
  cta: "Join the waitlist",
  note: "No payment is taken and no card details are needed to join the waitlist. It’s one email so we can let you know the moment we reopen.",
} as const;

// mailto keeps the waitlist honest with no backend behind it: the button does
// exactly what it says, and there is no form quietly collecting details while
// the shop is shut.
export function waitlistMailto(edition?: string) {
  // The package names are not uniform — "Standard" but "Family Edition" — so the
  // subject uses the name as written rather than appending a word to it.
  const subject = encodeURIComponent(edition ? `Waitlist — ${edition}` : "Waitlist — Birthday Hero Book");
  const body = encodeURIComponent(
    [
      "Please add me to the waitlist and let me know when Birthday Hero Book reopens.",
      "",
      edition ? `Edition I’m interested in: ${edition}` : "Edition I’m interested in: ",
      "The birthday is on: ",
    ].join("\n"),
  );
  return `mailto:${siteConfig.contactEmail}?subject=${subject}&body=${body}`;
}
