import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund & Corrections Policy" };

export default function RefundPage() {
  return <LegalPage eyebrow="If something isn’t right" title="Refund & Corrections Policy" updated="15 July 2026" sections={[
    { title: "Corrections we will make", body: <p>If we made an error in a name or in the supplied personalisation details, we will make reasonable corrections at no extra cost. Please contact us promptly with the order number and a clear description of the issue.</p> },
    { title: "Changes after work begins", body: <p>Because every book is made to order, new preferences or details supplied after production begins may not be included, or may require an additional fee. We will always explain the options before making a charge.</p> },
    { title: "Refunds", body: <p>The final policy must be aligned with applicable UK consumer law for personalised digital content, including the checkout consent and cancellation wording used before production begins. Where a product is faulty, not as described or cannot be delivered, statutory rights are unaffected.</p> },
    { title: "How to contact us", body: <p>Include the purchaser name, order number and a brief description of the problem. Do not resend a child’s photograph unless we specifically ask for it through a secure channel.</p> },
  ]} />;
}
