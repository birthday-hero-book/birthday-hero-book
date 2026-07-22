"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavItem = { label: string; href: string };

// The main nav is hidden below 1050px, so this supplies the same links behind a
// hamburger. Renders as a fragment: the toggle sits in the header's flex row and
// the panel is absolutely positioned against .nav-shell, which is relative.
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    }

    // Close when the tap lands outside both the panel and the toggle.
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`mobile-nav-toggle ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <div id="mobile-nav-panel" ref={panelRef} className="mobile-nav-panel" hidden={!open}>
        <nav aria-label="Main navigation">
          {items.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ),
          )}
        </nav>
      </div>
    </>
  );
}
