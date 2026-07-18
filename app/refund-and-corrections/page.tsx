import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Refund & Corrections Policy" };

export default function RefundPage() {
  return <LegalPage eyebrow="If something isn’t right" title="Refund & Corrections Policy" updated="18 July 2026" sections={[
    { title: "Corrections we’ll make", body: <p>If we made an error in a name or in the personalisation details you supplied, we will put it right at no extra cost. Please contact us promptly with your order number and a clear description of what needs correcting.</p> },
    { title: "Changes after work begins", body: <p>Because every book is made to order, new preferences or details supplied after production has begun may not be included, or may require an additional fee. We will always explain the options before making any charge.</p> },
    { title: "Cancelling an order", body: <p>Because each Birthday Hero Book is personalised and made to order specifically for your child, it is exempt from the standard 14-day right to cancel that applies to many online purchases, and cannot be refunded once we have begun creating it. If you need to change or cancel, please contact us as soon as possible after ordering and we will help wherever we can before work starts.</p> },
    { title: "Faulty, incorrect or undelivered orders", body: <p>If your book is faulty, not as described, or is not delivered, you are entitled to a repair, replacement or refund as appropriate. This does not affect your legal rights as a consumer under UK law.</p> },
    { title: "How to contact us", body: <p>Please include the purchaser’s name, your order number and a brief description of the problem. For privacy, do not resend a child’s photograph unless we specifically ask you to through a secure channel.</p> },
  ]} />;
}
