"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { MobileNav, type NavItem } from "./MobileNav";
import { Announcement, Faqs, FinalCta, FoundingOffer, Pricing } from "./SharedSections";
import { PersonalisationDemo } from "./PersonalisationDemo";
import { SiteFooter } from "./SiteFooter";
import { siteConfig } from "@/lib/site-config";

const names = ["Amelia", "Leo", "Maya", "Noah"];

// Shared by the desktop nav and the hamburger below 1050px so the two can't drift.
const navItems: NavItem[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Adventures", href: "#adventures" },
  { label: "See a Sample", href: "/sample-book" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
  { label: "Partner sign in", href: "/partners" },
];

export default function VersionOne() {
  const [nameIndex, setNameIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNameIndex((current) => (current + 1) % names.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="v1">
      <Announcement variant="one" />
      <header className="nav-shell v1-nav">
        <Brand />
        <nav aria-label="Main navigation">
          {navItems.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.href} href={item.href}>{item.label}</a>
            ) : (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ),
          )}
        </nav>
        <Link className="nav-cta" href="#pricing">Create Their Book</Link>
        <MobileNav items={navItems} />
      </header>

      <section className="v1-hero">
        <div className="v1-hero-copy">
          <h1>Make Your Child the Hero of Their Own <em>Birthday Story</em></h1>
          <p>A beautifully illustrated adventure created around their name, appearance, favourite things and birthday.</p>
          <div className="button-row">
            <Link className="button button-primary" href="#pricing">Create Their Birthday Hero Book</Link>
            <a className="button button-quiet" href="#how-it-works">See How It Works</a>
          </div>
          <div className="hero-reassurance">
            <span><b>3–10</b> years</span>
            <span><b>5 days</b> delivery</span>
            <span><b>PDF</b> print-ready</span>
          </div>
        </div>

        <div className="v1-hero-stage" aria-label={`Sample cover personalised for ${names[nameIndex]}`}>
          <div className="orbit-note note-one">Their name.</div>
          <div className="orbit-note note-two">Their world.</div>
          <div className="orbit-note note-three">Their big day.</div>
          <div className="floating-page page-left">
            <span>Chapter 04</span>
            <strong>The candles lit<br />the whole sky.</strong>
          </div>
          <div className="hero-book">
            <Image src="/illustrations/adventure-world.png" alt="An illustrated child hero surrounded by dinosaurs, planets and a mystery manor" fill priority sizes="(max-width: 800px) 82vw, 38vw" />
            <div className="hero-book-overlay" />
            <div className="hero-book-title">
              <span>A birthday adventure starring</span>
              <strong key={names[nameIndex]}>{names[nameIndex]}</strong>
              <small>and the Great Birthday Quest</small>
            </div>
            <i aria-hidden="true">✦</i>
          </div>
          <div className="floating-page page-right">
            <div className="mini-scene" />
            <p>“And that was the moment {names[nameIndex]} knew this birthday would be different.”</p>
            <span>07 / 20</span>
          </div>
        </div>
      </section>

      <section className="value-strip" aria-label="Product highlights">
        {[
          ["01", "Created uniquely", "for your child"],
          ["02", "Beautifully", "illustrated"],
          ["03", "Ready to print", "and treasure"],
          ["04", "Delivered within", "five working days"],
        ].map(([number, title, detail]) => <div key={number}><span>{number}</span><strong>{title}<small>{detail}</small></strong></div>)}
      </section>

      <section className="v1-intro">
        <p className="statement">They won’t just hear their name. They’ll recognise <em>themselves</em> — their hair, their favourite colour, even the family pet who joins the quest.</p>
      </section>

      <section id="personalise" className="v1-demo-section">
        <PersonalisationDemo variant="one" />
      </section>

      <section id="how-it-works" className="v1-how">
        <div className="section-heading">
          <div className="section-kicker">From child to hero</div>
          <h2>Three simple steps.<br />One extraordinary gift.</h2>
        </div>
        <div className="steps-editorial">
          {[
            ["01", "Tell us about your birthday hero", "Enter their first name, age, general appearance and favourite things. A photo is always optional."],
            ["02", "We create their adventure", "We weave those special details into a personalised, beautifully illustrated birthday story."],
            ["03", "Receive, print and enjoy", "Within five working days, their story arrives ready to read on a device or print and treasure."],
          ].map(([number, title, text], index) => (
            <article key={number}>
              <div className={`step-art step-art-${index + 1}`}>
                <span>{index === 0 ? "HERO" : index === 1 ? "✦" : "PDF"}</span>
              </div>
              <div><span className="step-number">{number}</span><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="adventures" className="v1-adventures">
        <div className="section-heading adventure-heading">
          <div><div className="section-kicker">Choose their world</div><h2>Three adventures.<br />Infinite little details.</h2></div>
          <p>Every story follows their personality—not a formula. Choose the world that will make their eyes light up.</p>
        </div>
        <div className="adventure-grid">
          {siteConfig.themes.map((theme, index) => (
            <article className={`adventure-card adventure-${theme.id}`} key={theme.id}>
              <div className="adventure-image">
                <Image
                  src={theme.image}
                  alt={theme.imageAlt}
                  fill
                  loading="eager"
                  sizes="(max-width: 800px) 90vw, 30vw"
                />
                <div className="adventure-index">0{index + 1}</div>
                <div className="adventure-symbol" aria-hidden="true">{theme.id === "dinosaur" ? "◒" : theme.id === "space" ? "✦" : "⌕"}</div>
              </div>
              <div className="adventure-copy">
                <h3>{theme.name}</h3>
                <p>{theme.description}</p>
                <blockquote>“{theme.example}”</blockquote>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="book-experience">
        <div className="book-experience-copy">
          <div className="section-kicker">Inside their book</div>
          <h2>Made to be opened. Then opened again.</h2>
          <p>A print-ready story designed with the pacing, detail and wonder of a real picture book—not a novelty with their name dropped in.</p>
          <Link className="button button-light book-experience-cta" href="/sample-book">See a Sample</Link>
        </div>
        <div className="spread-stack">
          <div className="sample-cover"><Image src="/illustrations/adventure-world.png" alt="Sample personalised book cover" fill sizes="36vw" /><strong>NOAH’S<br />BIRTHDAY<br />QUEST</strong><span>Front cover</span></div>
          <div className="sample-spread spread-a"><div /><p>Past the whispering palms, a gentle giant was waiting...</p><span>Illustrated spread</span></div>
          <div className="sample-spread spread-b"><p>“Make a wish,” said everyone Noah loved.</p><strong>Happy 7th Birthday,<br />our brilliant explorer.</strong><span>Personal message</span></div>
          <div className="sample-device"><div className="device-screen"><Image src="/illustrations/adventure-world.png" alt="Sample book displayed on a tablet" fill sizes="28vw" /></div><span>Print-ready PDF + device friendly</span></div>
        </div>
      </section>

      <section className="v1-benefits">
        <div className="benefit-lead"><div className="section-kicker">Why it means more</div><h2>A present for today.<br /><em>A memory for always.</em></h2></div>
        <div className="benefit-list">
          {[
            ["Starring them", "Your child is the main character, not a name in the background."],
            ["True to who they are", "Their personality, interests and appearance shape the adventure."],
            ["Impossible to find on the high street", "A gift created for one child—and nobody else."],
            ["Easy to give", "Digital delivery means no shipping wait and simple home or professional printing."],
            ["Made to keep", "A birthday story families can revisit long after the candles are gone."],
            ["For every proud grown-up", "A meaningful choice for parents, grandparents, aunts, uncles and family friends."],
          ].map(([title, text], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <Pricing variant="one" />
      <FoundingOffer variant="one" />
      <Faqs variant="one" />
      <FinalCta variant="one" />
      <SiteFooter />
    </main>
  );
}
