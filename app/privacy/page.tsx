import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Your information" title="Privacy Policy" updated="15 July 2026" sections={[
    { title: "What we collect", body: <><p>To create an order, we expect to collect the purchaser’s name, email and order reference, plus the child’s first name, age they are turning, general appearance, interests, chosen theme and the optional story details you provide.</p><p>We do not ask for a child’s surname, exact date of birth, school, home address or precise location. Please do not include them.</p></> },
    { title: "Optional photographs", body: <><p>A photograph is optional. You may describe appearance instead. If supplied, it is intended to be used only to create the purchased product and to be retained only for the period described in the final reviewed retention schedule.</p></> },
    { title: "How information is used", body: <ul><li>To verify and fulfil the order.</li><li>To personalise the text and illustrations.</li><li>To deliver the digital product and respond to corrections.</li><li>To communicate essential order updates.</li></ul> },
    { title: "Marketing", body: <p>Marketing email consent is optional, separate and never preselected. A child’s photograph, story or details will not be used for marketing without a further explicit permission process.</p> },
    { title: "Storage, processors and deletion", body: <><p>The final policy must identify every live processor, storage location, retention period, lawful basis, security measure and international transfer. These details will be completed when Stripe and the chosen form/automation platform are connected.</p><p>Purchasers will be able to request access, correction or deletion by contacting us, subject to applicable record-keeping requirements.</p></> },
  ]} />;
}
