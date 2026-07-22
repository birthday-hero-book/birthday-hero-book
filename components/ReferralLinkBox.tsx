"use client";

import { useState } from "react";

// The referral-link banner with a copy-to-clipboard button. Client component so
// it can use the Clipboard API and show feedback.
export function ReferralLinkBox({ link, label = "Your referral link" }: { link: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave the link visible
      // for manual copying.
      setCopied(false);
    }
  }

  return (
    <div className="portal-linkbox">
      <span>{label}</span>
      <div className="portal-linkbox-right">
        <code>{link}</code>
        <button type="button" className="portal-copy-btn" onClick={copy} aria-live="polite">
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
