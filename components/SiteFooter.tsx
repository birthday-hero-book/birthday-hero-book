import Link from "next/link";
import { Brand } from "./Brand";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter({ inverse = false }: { inverse?: boolean }) {
  return (
    <footer className={`site-footer ${inverse ? "site-footer--inverse" : ""}`}>
      <div className="footer-top">
        <div>
          <Brand inverse={inverse} />
          <p>One remarkable child. One story that could only be theirs.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How It Works</a>
          <a href="#adventures">Adventures</a>
          <a href="#pricing">Pricing</a>
          <a href="#faqs">FAQs</a>
        </nav>
        <nav aria-label="Policies">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-and-corrections">Refund & Corrections</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <CookieSettingsButton />
          <a href={`mailto:${siteConfig.contactEmail}`}>Contact</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Birthday Hero Book</span>
        <span>❤️{"\u00A0\u00A0"}Made with love for big imaginations.</span>
      </div>
    </footer>
  );
}
