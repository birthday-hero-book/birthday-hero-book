import Link from "next/link";
import { CheckIcon } from "./Brand";
import { CheckoutConfirm } from "./CheckoutConfirm";
import { isFoundingOfferOpen } from "@/lib/founding";
import { ORDERS_OPEN, waitlist, waitlistMailto } from "@/lib/ordering";
import { faqs, siteConfig } from "@/lib/site-config";

export function Pricing({ variant }: { variant: "one" | "two" }) {
  const checkoutKey = (id: string) => `${id}CheckoutUrl` as keyof typeof siteConfig.checkoutUrls;
  return (
    <section id="pricing" className={`pricing pricing--${variant}`}>
      <div className="section-heading centered">
        <div className="section-kicker">{ORDERS_OPEN ? "Choose their edition" : waitlist.kicker}</div>
        <h2>{ORDERS_OPEN ? "A gift they’ll find nowhere else." : waitlist.heading}</h2>
        <p>{ORDERS_OPEN
          ? "Every edition is carefully personalised, beautifully illustrated and delivered as a print-ready digital keepsake."
          : waitlist.intro}</p>
      </div>
      {!ORDERS_OPEN && <p className="waitlist-strip"><span aria-hidden="true">◷</span> {waitlist.strip}</p>}
      <div className="price-grid">
        {siteConfig.packages.map((item) => {
          // Keep the featured card’s styling, but swap what its chip says: while
          // the shop is shut every card is labelled sold out, and "Most Popular"
          // — a nudge to buy something that is not for sale — comes off.
          const featured = "badge" in item;
          const badge = ORDERS_OPEN ? ("badge" in item ? item.badge : undefined) : waitlist.badge;
          return (
          <article className={`price-card ${featured ? "featured" : ""}`} key={item.id}>
            {badge && <span className="price-badge">{badge}</span>}
            <div className="price-head">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="price"><span>£</span>{item.price}</div>
              <small>{ORDERS_OPEN ? "one-off payment" : "one-off payment, when we reopen"}</small>
            </div>
            <ul>
              {item.features.map((feature) => <li key={feature}><CheckIcon /> {feature}</li>)}
            </ul>
            {ORDERS_OPEN ? (
              <CheckoutConfirm
                packageName={item.name}
                price={item.price}
                href={siteConfig.checkoutUrls[checkoutKey(item.id)]}
                className={`button ${featured ? "button-primary" : "button-outline"}`}
              />
            ) : (
              // No href to a payment page while the shop is closed — not even an
              // inert one, since the markup is the only thing standing between a
              // visitor and Stripe. The slot becomes the waitlist instead.
              <a className={`button ${featured ? "button-primary" : "button-outline"}`} href={waitlistMailto(item.name)}>
                {waitlist.cta}
              </a>
            )}
          </article>
        )})}
      </div>
      <p className="payment-note">{ORDERS_OPEN
        ? "Secure checkout via Stripe · No subscription · All prices include the complete digital product"
        : waitlist.note}</p>
    </section>
  );
}

export function Faqs({ variant }: { variant: "one" | "two" }) {
  return (
    <section id="faqs" className={`faqs faqs--${variant}`}>
      <div className="section-heading">
        <div className="section-kicker">Good to know</div>
        <h2>Your questions, answered.</h2>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}<span aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Announcement({ variant }: { variant: "one" | "two" }) {
  // The bar exists to carry the founding deadline. Once that passes there is no
  // announcement left to make, so it goes entirely rather than restating a price
  // the pricing section already covers.
  if (!isFoundingOfferOpen()) return null;
  const fromPrice = Math.min(...siteConfig.packages.map((item) => item.price));
  return (
    <div className={`announcement announcement--${variant}`}>
      <p><span>Founding release</span> Personalised birthday books from £{fromPrice} <i aria-hidden="true">·</i> founding prices end {siteConfig.foundingDeadline}</p>
      <a href="#pricing">See the offer <span aria-hidden="true">→</span></a>
    </div>
  );
}

export function FoundingOffer({ variant }: { variant: "one" | "two" }) {
  // The whole section is the time-limited offer — the free invitation set and
  // the deadline. Once it closes there is nothing here left to honour, so the
  // section retires rather than advertising an extra that no longer applies.
  if (!isFoundingOfferOpen()) return null;
  return (
    <section className={`founding founding--${variant}`}>
      <div className="founding-art" aria-hidden="true">
        <span>YOU’RE INVITED</span>
        <strong>A magical<br />birthday awaits</strong>
        <i>✦</i>
      </div>
      <div className="founding-copy">
        <div className="section-kicker">The founding extra</div>
        <h2>Join the Founding Birthday Heroes.</h2>
        <p>Order during our founding release and receive a matching personalised printable birthday invitation set at no extra cost.</p>
        <div className="deadline"><span aria-hidden="true">◷</span> Founding prices end {siteConfig.foundingDeadline}.</div>
        <Link className="button button-primary" href="#pricing">Create Their Book</Link>
      </div>
    </section>
  );
}

export function FinalCta({ variant }: { variant: "one" | "two" }) {
  return (
    <section className={`final-cta final-cta--${variant}`}>
      <span className="final-spark" aria-hidden="true">✦</span>
      <p>One birthday. One unforgettable role.</p>
      <h2>Their birthday only happens once this year. <em>Put them at the centre of the story.</em></h2>
      <Link className="button button-light" href="#pricing">Create Their Birthday Hero Book {variant === "two" && <span aria-hidden="true">→</span>}</Link>
    </section>
  );
}
