"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { siteConfig } from "@/lib/site-config";

// The pricing CTA used to jump straight to Stripe, so buyers who expected to
// start describing their child met a card form instead. This keeps the same
// destination but shows what happens next first.
//
// It renders a real <a href> to the payment link, so without JavaScript — and on
// modified clicks (⌘/ctrl/shift/middle) — it behaves exactly as it did before.
export function CheckoutConfirm({
  packageName,
  price,
  href,
  className,
}: {
  packageName: string;
  price: number;
  href: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLAnchorElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const sheet = sheetRef.current;
    const focusable = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);

    // Focus the primary action explicitly: "Back" comes first in the DOM so that
    // tab order matches the visual order, but the forward path should be first
    // for the keyboard.
    (primaryRef.current ?? focusable()[0])?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Keep focus inside the dialog while it is open.
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <a
        ref={triggerRef}
        className={className}
        href={href}
        onClick={(event) => {
          // Let the browser handle "open in new tab" and friends.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        Choose {packageName}
      </a>

      {/* Portalled to <body>: the featured price card sets color:white and a
          transform, and a transformed ancestor becomes the containing block for
          position:fixed — so rendering in place broke both the sheet's colours
          and its full-screen overlay. */}
      {open && createPortal(
        <div
          className="confirm-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="confirm-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={sheetRef}>
            <span className="confirm-eyebrow">Step 1 of 3 · {packageName} · £{price}</span>
            <h2 id={titleId}>Next: secure payment</h2>
            <p>
              You’ll pay with Stripe, then you’ll be brought straight back here to tell us about your
              birthday hero.
            </p>

            <ol className="confirm-steps">
              <li>
                <span aria-hidden="true">1</span>
                <div>
                  <b>Pay £{price} securely</b>
                  <small>Card, Apple Pay, Klarna or Amazon Pay — handled by Stripe</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">2</span>
                <div>
                  <b>Personalise their book</b>
                  <small>Name, age, what they love, an optional photo — about 3 minutes</small>
                </div>
              </li>
              <li>
                <span aria-hidden="true">3</span>
                <div>
                  <b>We make it</b>
                  <small>Emailed as a print-ready PDF {siteConfig.deliveryTime}</small>
                </div>
              </li>
            </ol>

            <div className="confirm-actions">
              <button type="button" className="button button-quiet" onClick={close}>Back</button>
              <a ref={primaryRef} className="button button-primary" href={href}>Continue to Stripe <span aria-hidden="true">→</span></a>
            </div>
            <p className="confirm-fine">Have their details to hand — the next step takes about 3 minutes.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
