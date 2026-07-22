"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { sampleBook, sampleBookPages } from "@/lib/sample-book";

// Page-turner for the example book at /sample-book. One page is shown large
// rather than as a two-page spread on purpose: the story text is baked into the
// artwork, so the bigger a page renders the more readable it is.
//
// The book is view-only — there is deliberately no download control, and the
// images behind it are screen resolution only.
export function SampleBookReader({ fromPrice }: { fromPrice: number }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = sampleBookPages.length;
  const current = sampleBookPages[index];
  const previous = index > 0 ? sampleBookPages[index - 1] : null;
  const next = index < total - 1 ? sampleBookPages[index + 1] : null;

  const goTo = useCallback((target: number) => {
    setIndex(Math.max(0, Math.min(sampleBookPages.length - 1, target)));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined) return;
    const travelled = end - start;
    if (Math.abs(travelled) < 40) return;
    goTo(travelled < 0 ? index + 1 : index - 1);
  }

  return (
    <main className="samplebook">
      <header className="samplebook-bar">
        <Link className="samplebook-brand" href="/" aria-label="Birthday Hero Book home">
          <span aria-hidden="true">✦</span><b>Birthday Hero Book</b>
        </Link>
        <Link className="samplebook-cta" href="/#pricing">Create their book — from £{fromPrice}</Link>
      </header>

      <p className="samplebook-notice">
        <b>This is our own sample book.</b> We created Maya, her story and her dedication ourselves to show
        exactly what you’ll receive. We never publish a real child’s book, name, photo or details.
      </p>

      <div className="samplebook-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button
          type="button"
          className="samplebook-arrow"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous page"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="samplebook-pages">
          {previous ? (
            <button
              type="button"
              className="samplebook-peek"
              onClick={() => goTo(index - 1)}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image src={previous.src} alt="" width={sampleBook.pageWidth} height={sampleBook.pageHeight} sizes="20vw" />
            </button>
          ) : <span className="samplebook-peek is-empty" aria-hidden="true" />}

          <figure className="samplebook-page">
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              width={sampleBook.pageWidth}
              height={sampleBook.pageHeight}
              sizes="(max-width: 760px) 88vw, 420px"
              priority={index < 2}
              draggable={false}
            />
          </figure>

          {next ? (
            <button
              type="button"
              className="samplebook-peek"
              onClick={() => goTo(index + 1)}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image src={next.src} alt="" width={sampleBook.pageWidth} height={sampleBook.pageHeight} sizes="20vw" />
            </button>
          ) : <span className="samplebook-peek is-empty" aria-hidden="true" />}
        </div>

        <button
          type="button"
          className="samplebook-arrow"
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          aria-label="Next page"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p className="samplebook-counter" aria-live="polite">
        Page <b>{current.number}</b> of {total} — {current.label}
      </p>

      <nav className="samplebook-dots" aria-label="Jump to a page">
        {sampleBookPages.map((item, position) => (
          <button
            key={item.src}
            type="button"
            className={position === index ? "is-current" : ""}
            onClick={() => goTo(position)}
            aria-label={`Go to page ${item.number}: ${item.label}`}
            aria-current={position === index ? "true" : undefined}
          />
        ))}
      </nav>

      <p className="samplebook-hint">Use the arrow keys, swipe, or click the pages either side</p>

      <footer className="samplebook-tail">
        <p>
          <b>This sample is a {sampleBook.edition} edition</b> — a {sampleBook.storyPageCount}-page story plus
          cover, title page and dedication. Deluxe extends the story to 20 pages; Family follows two children.
          Maya is a character we invented, and her dedication was written by us.
        </p>
        <Link className="samplebook-cta" href="/#pricing">Create their book — from £{fromPrice}</Link>
      </footer>
    </main>
  );
}
