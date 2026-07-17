"use client";

// A footer control that re-opens the cookie preferences so visitors can change
// or withdraw consent at any time (a GDPR requirement).
export function CookieSettingsButton() {
  return (
    <button type="button" className="footer-cookie-btn" onClick={() => window.dispatchEvent(new Event("bhb:open-consent"))}>
      Cookie settings
    </button>
  );
}
