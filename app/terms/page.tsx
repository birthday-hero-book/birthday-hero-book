import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <LegalPage eyebrow="Ordering from us" title="Terms of Sale" updated="15 July 2026" sections={[
    { title: "The product", body: <p>The founding Birthday Hero Book product is a personalised high-resolution digital PDF. It is not a physical book. Any preview shown on the website is illustrative; the final design may vary while retaining the purchased theme and supplied personalisation.</p> },
    { title: "Your order", body: <p>You must be at least 18 and the child’s parent, guardian or an adult authorised to supply their information. You are responsible for checking spelling and the accuracy of the details submitted. Orders begin once payment and complete personalisation details have been received.</p> },
    { title: "Delivery", body: <p>We aim to deliver by email within five working days after receiving complete details. If clarification is needed, the delivery window may begin when that clarification is received. Any material delay will be communicated to the purchaser.</p> },
    { title: "Personal use", body: <p>The finished book is licensed for the purchaser’s personal, non-commercial use, including home printing or use of a print service for personal copies. The artwork and product design may not be resold or commercially reproduced.</p> },
    { title: "Appropriate content", body: <p>We may decline details or requests that are unsafe, discriminatory, unlawful, infringing or unsuitable for a children’s product. If we cannot fulfil an order for this reason, we will contact the purchaser about the available options.</p> },
  ]} />;
}
