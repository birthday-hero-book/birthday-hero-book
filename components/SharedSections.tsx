import Link from "next/link";
import { CheckIcon } from "./Brand";
import { faqs, siteConfig } from "@/lib/site-config";

export function Pricing({ variant }: { variant: "one" | "two" }) {
  const checkoutKey = (id: string) => `${id}CheckoutUrl` as keyof typeof siteConfig.checkoutUrls;
  return (
    <section id="pricing" className={`pricing pricing--${variant}`}>
      <div className="section-heading centered">
        <div className="section-kicker">Choose their edition</div>
        <h2>A gift they’ll find nowhere else.</h2>
        <p>Every edition is carefully personalised, beautifully illustrated and delivered as a print-ready digital keepsake.</p>
      </div>
      <div className="price-grid">
        {siteConfig.packages.map((item) => {
          const badge = "badge" in item ? item.badge : undefined;
          return (
          <article className={`price-card ${badge ? "featured" : ""}`} key={item.id}>
            {badge && <span className="price-badge">{badge}</span>}
            <div className="price-head">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="price"><span>£</span>{item.price}</div>
              <small>one-off payment</small>
            </div>
            <ul>
              {item.features.map((feature) => <li key={feature}><CheckIcon /> {feature}</li>)}
            </ul>
            <Link className={`button ${badge ? "button-primary" : "button-outline"}`} href={siteConfig.checkoutUrls[checkoutKey(item.id)]}>
              Choose {item.name}
            </Link>
          </article>
        )})}
      </div>
      <p className="payment-note">Secure checkout via Stripe when live · No subscription · All prices include the complete digital product</p>
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
  return (
    <div className={`announcement announcement--${variant}`}>
      <p><span>Founding release</span> Personalised birthday books from £49 <i aria-hidden="true">·</i> founding prices end {siteConfig.foundingDeadline}</p>
      <a href="#pricing">See the offer <span aria-hidden="true">→</span></a>
    </div>
  );
}

export function FoundingOffer({ variant }: { variant: "one" | "two" }) {
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
