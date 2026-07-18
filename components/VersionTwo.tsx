"use client";

import Image from "next/image";
import Link from "next/link";
import { Brand } from "./Brand";
import { Announcement, Faqs, FinalCta, FoundingOffer, Pricing } from "./SharedSections";
import { PersonalisationDemo } from "./PersonalisationDemo";
import { SiteFooter } from "./SiteFooter";
import { siteConfig } from "@/lib/site-config";

export default function VersionTwo() {
  return (
    <main className="v2">
      <Announcement variant="two" />
      <div className="v2-night">
        <header className="nav-shell v2-nav">
          <Brand inverse />
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How It Works</a>
            <a href="#adventures">Adventures</a>
            <a href="#pricing">Pricing</a>
            <a href="#faqs">FAQs</a>
            <Link href="/partners">Partner sign in</Link>
          </nav>
          <Link className="nav-cta" href="#pricing">Create Their Book <span aria-hidden="true">✦</span></Link>
        </header>

        <section className="v2-hero">
          <div className="theatre-stars" aria-hidden="true"><i>✦</i><i>·</i><i>✧</i><i>·</i><i>✦</i></div>
          <div className="v2-hero-copy">
            <span className="v2-pretitle">Tonight’s starring role goes to...</span>
            <h1>Make Your Child the Hero of Their Own <em>Birthday Story</em></h1>
            <p>A beautifully illustrated adventure created around their name, appearance, favourite things and birthday.</p>
            <div className="button-row">
              <Link className="button button-gold" href="#pricing">Create Their Birthday Hero Book <span aria-hidden="true">✦</span></Link>
              <a className="button button-ghost" href="#how-it-works">See How It Works <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="theatre-frame">
            <div className="curtain curtain-left" />
            <div className="curtain curtain-right" />
            <div className="curtain-swag" />
            <div className="stage-image"><Image src="/illustrations/birthday-theatre.png" alt="A child hero walking from a giant storybook onto a magical birthday theatre stage" fill priority sizes="(max-width: 800px) 94vw, 46vw" /></div>
            <div className="marquee-name"><small>AN ORIGINAL BIRTHDAY ADVENTURE</small><strong>STARRING <span>AMELIA</span></strong></div>
            <div className="footlights" aria-hidden="true">{Array.from({ length: 8 }).map((_, index) => <i key={index} />)}</div>
          </div>
          <div className="admit-ticket ticket-left"><span>ADMIT ONE</span><strong>AGE 7</strong><small>THE BIRTHDAY THEATRE</small></div>
          <div className="admit-ticket ticket-right"><span>CURTAIN UP</span><strong>IN 5 DAYS</strong><small>PRINT • READ • TREASURE</small></div>
        </section>
      </div>

      <section className="v2-value" aria-label="Product highlights">
        <p>Every great story needs...</p>
        {[
          ["✦", "One true hero", "Created uniquely for your child"],
          ["☾", "A beautiful world", "Richly illustrated from cover to finish"],
          ["⌁", "A place to keep it", "Ready to print and treasure"],
          ["◷", "A timely arrival", "Delivered within five working days"],
        ].map(([symbol, title, detail]) => <div key={title}><span>{symbol}</span><strong>{title}</strong><small>{detail}</small></div>)}
      </section>

      <section className="v2-prologue">
        <span className="chapter-label">Prologue</span>
        <div>
          <p className="dropcap">There is a moment when a child sees their own name on the cover, looks closer, and realises the whole adventure belongs to them.</p>
          <aside>That look is why we make Birthday Hero Books.</aside>
        </div>
      </section>

      <section id="personalise" className="v2-demo-section">
        <div className="v2-section-title"><span>Act I</span><h2>The magic begins with their name.</h2><p>Try a few details. Watch the story become unmistakably theirs.</p></div>
        <PersonalisationDemo variant="two" />
      </section>

      <section id="how-it-works" className="v2-how">
        <div className="v2-section-title light"><span>Act II</span><h2>From the first detail<br />to the final page.</h2></div>
        <div className="v2-steps">
          {[
            ["01", "Tell us about your birthday hero", "Share their first name, age, general appearance and favourite things. A photograph is optional."],
            ["02", "We create their adventure", "Those details take the leading role in a personalised, illustrated birthday story."],
            ["03", "Receive, print and enjoy", "Their finished digital book arrives within five working days, ready for the big reveal."],
          ].map(([number, title, text], index) => (
            <article key={number}>
              <div className="step-medallion"><span>{number}</span><i aria-hidden="true">{index === 0 ? "✎" : index === 1 ? "✦" : "⌄"}</i></div>
              <h3>{title}</h3><p>{text}</p>
              {index < 2 && <b className="step-thread" aria-hidden="true">· · · ✦ · · ·</b>}
            </article>
          ))}
        </div>
      </section>

      <section id="adventures" className="v2-adventures">
        <div className="v2-section-title"><span>Choose the playbill</span><h2>Which world will call their name?</h2><p>Three original birthday worlds. One child in the starring role.</p></div>
        <div className="playbill-grid">
          {siteConfig.themes.map((theme, index) => (
            <article className={`playbill playbill-${theme.id}`} key={theme.id}>
              <div className="playbill-top"><span>WORLD PREMIERE</span><i>{String(index + 1).padStart(2, "0")}</i></div>
              <div className="playbill-art">
                <Image src={index === 1 ? "/illustrations/birthday-theatre.png" : "/illustrations/adventure-world.png"} alt="" fill sizes="(max-width: 800px) 84vw, 29vw" />
                <div className="playbill-cutout" aria-hidden="true">{theme.id === "dinosaur" ? "DINO" : theme.id === "space" ? "MOON" : "CLUE"}</div>
              </div>
              <div className="playbill-copy">
                <span>A birthday story in twenty scenes</span>
                <h3>{theme.name}</h3>
                <p>{theme.description}</p>
                <blockquote>{theme.example}</blockquote>
              </div>
              <a href="#personalise">Choose this adventure <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="v2-book-showcase">
        <div className="v2-section-title light"><span>Act III</span><h2>A whole world,<br />wrapped in one book.</h2><p>Designed to feel like a beautiful picture book from the very first cover to the very last birthday wish.</p></div>
        <div className="showcase-stage">
          <div className="show-book cover"><Image src="/illustrations/birthday-theatre.png" alt="Front cover of a personalised birthday storybook" fill sizes="30vw" /><span>A VERY SPECIAL STORY FOR</span><strong>MAYA</strong><small>THE BIRTHDAY MYSTERY</small></div>
          <div className="show-book spread-one"><div className="spread-picture"><Image src="/illustrations/adventure-world.png" alt="A sample illustrated story spread" fill sizes="30vw" /></div><p>The moon had lost its birthday glow—and only Maya knew where to look.</p></div>
          <div className="show-book spread-two"><p>For Maya,<br />who makes every day<br />an adventure.</p><strong>Happy 8th Birthday</strong><i>✦</i></div>
          <div className="show-tablet"><span /><Image src="/illustrations/birthday-theatre.png" alt="Personalised book shown on a tablet" fill sizes="30vw" /><small>High-resolution PDF · ready to print</small></div>
        </div>
      </section>

      <section className="v2-benefits">
        <div className="v2-section-title"><span>The reviews that matter</span><h2>Built for the wide-eyed pause before: “That’s me!”</h2></div>
        <div className="warmth-grid">
          {[
            ["The leading role", "Your child is the main character at the heart of every twist and triumph."],
            ["Their favourite things", "Interests, colours, family and pets make the story feel genuinely known."],
            ["Not found in shops", "It’s made for one remarkable child, not picked from a shelf."],
            ["Easy digital delivery", "No shipping wait. Read on screen or print at home or with a print service."],
            ["A family keepsake", "A story that brings the birthday feeling back, year after year."],
            ["From any loving grown-up", "A magical gift from parents, grandparents, relatives or family friends."],
          ].map(([title, text], index) => <article key={title}><span>{["★", "♥", "✦", "⌁", "☾", "∞"][index]}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <Pricing variant="two" />
      <FoundingOffer variant="two" />
      <Faqs variant="two" />
      <FinalCta variant="two" />
      <SiteFooter inverse />
    </main>
  );
}
