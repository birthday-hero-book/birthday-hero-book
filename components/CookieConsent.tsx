"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID, clearAnalyticsCookies, clearReferralCookie, readConsent, writeConsent, type ConsentRecord } from "@/lib/consent";

// GA respects a global window flag to stop sending immediately (no reload needed).
function setGaDisabled(disabled: boolean) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}

export function CookieConsent() {
  const [record, setRecord] = useState<ConsentRecord | null | undefined>(undefined);
  const [showBanner, setShowBanner] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analyticsChoice, setAnalyticsChoice] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setRecord(existing);
    if (existing) {
      setAnalyticsChoice(existing.analytics);
      setMarketingChoice(existing.marketing);
      setGaDisabled(!existing.analytics);
    } else {
      setShowBanner(true);
    }

    // Footer "Cookie settings" re-opens the panel so consent can be changed/withdrawn.
    const reopen = () => {
      const current = readConsent();
      setAnalyticsChoice(current?.analytics ?? false);
      setMarketingChoice(current?.marketing ?? false);
      setShowPrefs(true);
      setShowBanner(true);
    };
    window.addEventListener("bhb:open-consent", reopen);
    return () => window.removeEventListener("bhb:open-consent", reopen);
  }, []);

  function persist(analytics: boolean, marketing: boolean) {
    setRecord(writeConsent(analytics, marketing));
    setShowBanner(false);
    setShowPrefs(false);
    setGaDisabled(!analytics);
    if (!analytics) clearAnalyticsCookies();
    if (!marketing) clearReferralCookie();
  }

  const analyticsGranted = record?.analytics === true;

  return (
    <>
      {analyticsGranted && GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}</Script>
        </>
      )}

      {showBanner && (
        <div className="consent" role="region" aria-label="Cookie consent">
          <div className="consent-body">
            <strong>We use cookies</strong>
            <p>
              We use essential cookies to make this site work. With your consent we also use Google Analytics to
              understand how the site is used, and a marketing cookie to credit partners who refer you. See our{" "}
              <Link href="/cookies">Cookie Policy</Link>.
            </p>

            {showPrefs && (
              <div className="consent-prefs">
                <div className="consent-row consent-row--locked">
                  <span><b>Strictly necessary</b><small>Required for the site to work. Always on.</small></span>
                  <span className="consent-fixed">Always on</span>
                </div>
                <label className="consent-row">
                  <span><b>Analytics</b><small>Google Analytics — only if you allow it.</small></span>
                  <input type="checkbox" checked={analyticsChoice} onChange={(event) => setAnalyticsChoice(event.target.checked)} />
                </label>
                <label className="consent-row">
                  <span><b>Marketing</b><small>Remembers if a partner referred you, so they’re credited.</small></span>
                  <input type="checkbox" checked={marketingChoice} onChange={(event) => setMarketingChoice(event.target.checked)} />
                </label>
              </div>
            )}
          </div>

          <div className="consent-actions">
            {!showPrefs && (
              <button type="button" className="button button-quiet consent-btn" onClick={() => setShowPrefs(true)}>Manage</button>
            )}
            <button type="button" className="button button-outline consent-btn" onClick={() => persist(false, false)}>Reject all</button>
            {showPrefs ? (
              <button type="button" className="button button-primary consent-btn" onClick={() => persist(analyticsChoice, marketingChoice)}>Save choices</button>
            ) : (
              <button type="button" className="button button-primary consent-btn" onClick={() => persist(true, true)}>Accept all</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
