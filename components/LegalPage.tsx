import Link from "next/link";
import { Brand } from "./Brand";
import { siteConfig } from "@/lib/site-config";

type LegalSection = { title: string; body: React.ReactNode };

export function LegalPage({ eyebrow, title, updated, sections }: { eyebrow: string; title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="legal-page">
      <header><Brand /><Link href="/">Back to the website →</Link></header>
      <article>
        <div className="legal-heading"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>Last updated: {updated}</p></div>
        <div className="legal-notice"><strong>Birthday Hero Book is a UK-based service.</strong><p>These policies explain how we provide personalised digital storybooks, use order information and support purchasers.</p></div>
        {sections.map((section) => <section key={section.title}><h2>{section.title}</h2><div>{section.body}</div></section>)}
        <div className="legal-contact"><strong>Questions?</strong><a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></div>
      </article>
    </main>
  );
}
