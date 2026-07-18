import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <LegalPage eyebrow="Ordering from us" title="Terms of Sale" updated="18 July 2026" sections={[
    { title: "About these terms", body: <p>These terms apply when you buy a Birthday Hero Book from birthdayherobook.com. Please read them before you order — by placing an order you agree to them.</p> },
    { title: "The product", body: <p>The Birthday Hero Book is a personalised, high-resolution digital PDF storybook. It is not a physical book. Any preview shown on the website is illustrative; the finished design may vary while keeping the adventure you chose and the personalisation you supplied.</p> },
    { title: "Your order", body: <p>You must be at least 18 and the child’s parent or guardian, or an adult authorised to provide their details. You are responsible for checking the spelling and accuracy of everything you submit. Your order begins once payment and your complete personalisation details have been received.</p> },
    { title: "Prices and payment", body: <p>Prices are shown on the website in pounds sterling and include any tax that applies. Payment is taken securely at checkout by our payment provider, Stripe; we do not receive or store your card details. Your order is confirmed once payment and your complete details have been received.</p> },
    { title: "Delivery", body: <p>We aim to deliver your finished book by email within five working days of receiving your complete details. If we need to clarify anything, the delivery window may begin when we receive that clarification. We will let you know of any material delay.</p> },
    { title: "How you may use your book", body: <p>Your finished book is licensed for your personal, non-commercial use, including printing at home or through a print service for your own copies. We keep all rights in our illustrations, templates and designs, which may not be resold or reproduced commercially.</p> },
    { title: "Appropriate content", body: <p>We may decline details or requests that are unsafe, discriminatory, unlawful, infringing or unsuitable for a children’s product. If we cannot fulfil an order for this reason, we will contact you about the options available.</p> },
    { title: "Cancellations and refunds", body: <p>Because each book is personalised and made to order, specific cancellation and refund terms apply. Please see our <Link href="/refund-and-corrections">Refund &amp; Corrections Policy</Link>.</p> },
    { title: "Our responsibility to you", body: <p>If we fail to meet these terms, we are responsible for loss you suffer that is a foreseeable result of our breach. We are not responsible for losses that are not foreseeable, or that arise from details you supplied being inaccurate. Nothing in these terms limits our liability where it would be unlawful to do so, and your statutory rights as a consumer are not affected.</p> },
    { title: "Governing law", body: <p>These terms are governed by the law of England and Wales, and any dispute relating to them will be subject to the courts of England and Wales.</p> },
  ]} />;
}
