"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { siteConfig } from "@/lib/site-config";

function ThankYouPageContent() {
  const name = useSearchParams().get("hero") || "your hero";
  return (
    <main className="thanks-page">
      <header><Brand inverse /></header>
      <div className="confetti" aria-hidden="true">✦ <i>●</i> ▲ <i>✦</i> ●</div>
      <section className="thanks-card">
        <div className="thanks-mark">✓</div>
        <span className="section-kicker">The adventure is in motion</span>
        <h1>We’ve got {name}’s<br /><em>story details.</em></h1>
        <p>Thank you. In the live journey, we’d now carefully create their illustrated adventure and email it within five working days.</p>
        <div className="next-steps">
          <div><span>01</span><p><strong>Look for a confirmation</strong>We’ll send a summary to the purchaser email.</p></div>
          <div><span>02</span><p><strong>We create the magic</strong>Their details are woven through the story and artwork.</p></div>
          <div><span>03</span><p><strong>Open the big reveal</strong>The print-ready book arrives by email within five working days.</p></div>
        </div>
        <div className="thanks-actions"><Link className="button button-light" href="/">Return to Birthday Hero Book</Link><a href={`mailto:${siteConfig.contactEmail}`}>Questions? Email us</a></div>
        <small>This is a demonstration confirmation. No information has been sent to a server.</small>
      </section>
    </main>
  );
}

export default function ThankYouPage() {
  return <Suspense fallback={<main className="thanks-page" aria-busy="true" />}><ThankYouPageContent /></Suspense>;
}
