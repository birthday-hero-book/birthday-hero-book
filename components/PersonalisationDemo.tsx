"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { siteConfig, type ThemeId } from "@/lib/site-config";

const titleByTheme: Record<ThemeId, (name: string, age: string, favourite: string) => string> = {
  dinosaur: (name, age, favourite) => `${name} and the Great Dinosaur Birthday`,
  space: (name, age, favourite) => `${name}’s Magical Mission to the Birthday Moon`,
  mystery: (name, age, favourite) => `${name} and the Mystery of the Missing ${favourite || "Wish"}`,
};

export function PersonalisationDemo({ variant }: { variant: "one" | "two" }) {
  const [name, setName] = useState("Amelia");
  const [age, setAge] = useState("7");
  const [theme, setTheme] = useState<ThemeId>("dinosaur");
  const [favourite, setFavourite] = useState("stargazing");
  const safeName = name.trim() || "Your Hero";
  const title = useMemo(() => titleByTheme[theme](safeName, age, favourite), [safeName, age, theme, favourite]);

  if (variant === "one") {
    return (
      <div className="demo demo--one demo--informational">
        <div className="demo-controls demo-info">
          <div className="section-kicker">Personalised throughout</div>
          <h3>Every detail earns its place in the story.</h3>
          <p className="demo-info-intro">This is more than a name on the cover. The things that make your child who they are become part of a coherent, illustrated birthday adventure.</p>
          <div className="demo-detail-list">
            <article><span>01</span><div><h4>Their character</h4><p>First name, age and appearance shape the hero at the centre of every page.</p></div></article>
            <article><span>02</span><div><h4>Their favourite things</h4><p>Interests, colours and little obsessions give the adventure its most delightful details.</p></div></article>
            <article><span>03</span><div><h4>Their people and pets</h4><p>Optional family members and much-loved animals can join them in their birthday world.</p></div></article>
          </div>
          <p className="privacy-note"><span aria-hidden="true">●</span> A photograph is always optional. A written description works beautifully.</p>
        </div>

        <div className="demo-book theme-dinosaur">
          <div className="demo-book-art">
            <Image src="/illustrations/adventure-world.png" alt="Sample personalised birthday adventure cover for Noah" fill sizes="(max-width: 800px) 90vw, 46vw" />
          </div>
          <div className="demo-book-shine" />
          <div className="demo-book-copy">
            <span>A birthday adventure for</span>
            <strong>Noah and the Great Dinosaur Birthday</strong>
            <small>Starring Noah, age 7 · lover of stargazing</small>
          </div>
          <div className="book-spine" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className={`demo demo--${variant}`}>
      <form className="demo-controls" onSubmit={(event) => event.preventDefault()} aria-label="Personalisation preview controls">
        <div className="section-kicker"><span>Live preview</span> Make it theirs</div>
        <h3>See their story take shape.</h3>
        <div className="demo-grid">
          <label>
            Child’s first name
            <input maxLength={18} value={name} onChange={(event) => setName(event.target.value)} placeholder="First name only" />
          </label>
          <label>
            Age they’re turning
            <select value={age} onChange={(event) => setAge(event.target.value)}>
              {Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <fieldset>
            <legend>Choose an adventure</legend>
            <div className="theme-pills">
              {siteConfig.themes.map((item) => (
                <label key={item.id} className={theme === item.id ? "active" : ""}>
                  <input type="radio" name={`theme-${variant}`} value={item.id} checked={theme === item.id} onChange={() => setTheme(item.id)} />
                  <span aria-hidden="true">{item.id === "dinosaur" ? "◒" : item.id === "space" ? "✦" : "⌕"}</span>
                  {item.shortName.replace(" Adventure", "")}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="full-field">
            One favourite thing
            <input maxLength={24} value={favourite} onChange={(event) => setFavourite(event.target.value)} placeholder="e.g. stargazing" />
          </label>
        </div>
        <p className="privacy-note"><span aria-hidden="true">●</span> Demo only—nothing is saved or sent.</p>
      </form>

      <div className={`demo-book theme-${theme}`} aria-live="polite">
        <div className="demo-book-art">
          <Image src="/illustrations/birthday-theatre.png" alt="" fill sizes="(max-width: 800px) 90vw, 46vw" />
        </div>
        <div className="demo-book-shine" />
        <div className="demo-book-copy">
          <span>A birthday adventure for</span>
          <strong>{title}</strong>
          <small>Starring {safeName}, age {age} · lover of {favourite || "adventures"}</small>
        </div>
        <div className="book-spine" aria-hidden="true" />
      </div>
    </div>
  );
}
