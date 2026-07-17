import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CookieSettingsButton } from "@/components/CookieSettingsButton";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return <LegalPage eyebrow="Your choices" title="Cookie Policy" updated="17 July 2026" sections={[
    { title: "What cookies are", body: <p>Cookies are small files stored on your device. We use only a small number of them—some to make the site work, and, with your consent, some to understand how it is used.</p> },
    { title: "Strictly necessary", body: <p>These are required for the site to function—for example, remembering your cookie choices and keeping the secure order form working. They cannot be switched off and do not require consent.</p> },
    { title: "Analytics", body: <><p>With your consent, we use Google Analytics to see which pages are visited so we can improve the site. These cookies are not set unless you accept them, and we do not use them for advertising.</p><p>You are asked to accept or reject analytics on your first visit, and you can change your choice at any time.</p></> },
    { title: "Marketing", body: <p>If you accept marketing cookies, we store a small first-party cookie that remembers whether one of our partners referred you, so we can credit them for the introduction. It is not used for advertising and is not shared with third parties. It is only set if you allow it.</p> },
    { title: "Managing your choices", body: <><p>Use the button below, or the “Cookie settings” link in the footer of any page, to review or withdraw your consent. If you reject a category, those cookies are not placed and any existing ones are cleared.</p><p><CookieSettingsButton /></p></> },
  ]} />;
}
