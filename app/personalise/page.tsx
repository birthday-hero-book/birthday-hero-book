"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Pricing } from "@/components/SharedSections";
import { siteConfig } from "@/lib/site-config";

function PersonalisePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const packageId = params.get("package");
  const isDemo = params.get("demo") === "1";
  const stripeSessionId = params.get("session_id")?.trim() || "";
  const selectedPackage = siteConfig.packages.find((item) => item.id === packageId);
  const selectedCheckoutUrl = selectedPackage
    ? siteConfig.checkoutUrls[`${selectedPackage.id}CheckoutUrl` as keyof typeof siteConfig.checkoutUrls]
    : "#pricing";

  useEffect(() => { window.scrollTo(0, 0); }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!selectedPackage) return;
    setSubmitError("");
    setSubmitting(true);
    const formData = new FormData(form);
    formData.set("package", selectedPackage.id);
    formData.set("stripeSessionId", stripeSessionId);

    if (isDemo) {
      const safeDemoData = Object.fromEntries([...formData.entries()].filter(([key, value]) => key !== "photo" && typeof value === "string"));
      window.localStorage.setItem("birthdayHeroDemoSubmission", JSON.stringify({ ...safeDemoData, package: selectedPackage.name, submittedAt: new Date().toISOString() }));
      window.setTimeout(() => router.push(`/thank-you?hero=${encodeURIComponent(String(formData.get("childFirstName") || "your hero"))}&demo=1`), 650);
      return;
    }

    try {
      const response = await fetch("/api/orders", { method: "POST", body: formData });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save these details. Please try again.");
      router.push(`/thank-you?hero=${encodeURIComponent(String(formData.get("childFirstName") || "your hero"))}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not save these details. Please try again.");
      setSubmitting(false);
    }
  }

  if (!selectedPackage) {
    return (
      <main className="form-page package-choice-page">
        <header className="form-nav"><Brand /><div><span>Order details</span><b>Choose an edition to continue</b></div></header>
        <div className="form-progress"><span className="active">1 <i>Choose</i></span><b /><span>2 <i>Personalise</i></span><b /><span>3 <i>All done</i></span></div>
        <Pricing variant="one" />
      </main>
    );
  }

  if (!isDemo && !stripeSessionId) {
    return (
      <main className="form-page payment-gate-page">
        <header className="form-nav"><Brand /><div><span>Order details</span><b>Secure payment confirmation</b></div></header>
        <section className="payment-gate">
          <span className="section-kicker">Payment confirmation needed</span>
          <h1>Let’s confirm their edition first.</h1>
          <p>We couldn’t find the secure Stripe reference that is added automatically after payment. Return to checkout for the {selectedPackage.name} edition, or contact us if you have already paid.</p>
          <div className="button-row">
            <Link className="button button-primary" href={selectedCheckoutUrl}>Return to Secure Checkout</Link>
            <a className="button button-quiet" href={`mailto:${siteConfig.contactEmail}`}>Contact Us</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="form-page">
      <header className="form-nav"><Brand /><div><span>Order details</span><b>Secure personalisation form</b></div></header>
      <div className="form-progress"><span className="done">1 <i>Choose</i></span><b /><span className="active">2 <i>Personalise</i></span><b /><span>3 <i>All done</i></span></div>
      <section className="form-layout">
        <div className="form-main">
          <div className="form-heading">
            <span className="section-kicker">Now for the lovely details</span>
            <h1>Tell us about their world.</h1>
            <p>First names and broad details are all we need. A photograph is completely optional.</p>
          </div>
          <div className="privacy-callout"><span aria-hidden="true">◉</span><div><strong>We ask for less, on purpose.</strong><p>Please don’t share a surname, exact date of birth, school, address or precise location. Personalisation details are used only to create your order.</p></div></div>

          <form className="order-form" onSubmit={handleSubmit}>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="form-honeypot" />
            <fieldset>
              <legend><span>01</span> About the purchaser</legend>
              <div className="form-grid">
                <label>Your name<input name="purchaserName" autoComplete="name" required placeholder="Your full name" /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /><small>We’ll deliver the book here.</small></label>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>02</span> Meet the birthday hero</legend>
              <div className="form-grid">
                <label>Child’s first name only<input name="childFirstName" required maxLength={24} placeholder="e.g. Amelia" /><small>Please do not enter a surname.</small></label>
                <label>Age they are turning<select name="age" required defaultValue=""><option value="" disabled>Select age</option>{Array.from({ length: 8 }, (_, index) => index + 3).map((age) => <option key={age}>{age}</option>)}</select></label>
                <label className="full-field">General appearance description<textarea name="appearance" required rows={4} placeholder="e.g. Brown curly hair, warm brown skin, green glasses and a big gap-toothed smile" /><small>A broad, respectful description is perfect—no sensitive details needed.</small></label>
                <label className="full-field upload-label">Optional photograph<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhotoName(event.target.files?.[0]?.name || "")} /><span className="upload-box"><b>{photoName || "Choose a photo"}</b><small>JPG, PNG or WebP · optional · you may describe appearance instead</small></span></label>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>03</span> Shape their adventure</legend>
              <div className="form-grid">
                <label className="full-field">Adventure theme<select name="theme" required defaultValue=""><option value="" disabled>Choose their adventure</option>{siteConfig.themes.map((theme) => <option value={theme.id} key={theme.id}>{theme.name}</option>)}</select></label>
                <label className="full-field">Favourite interests<textarea name="interests" required rows={3} placeholder="Dinosaurs, dancing, building blanket forts, strawberries..." /></label>
                <label>Favourite colour<input name="favouriteColour" required placeholder="e.g. Sunshine yellow" /></label>
                <label>Optional pet<input name="pet" placeholder="Name, type and a little detail" /></label>
                <label className="full-field">Optional family members<textarea name="family" rows={3} placeholder="First names and relationship only, e.g. Nana Jo and big brother Sam" /></label>
                <label className="full-field">Anything to avoid?<textarea name="avoid" rows={3} placeholder="Characters, situations, words or themes your child may dislike" /></label>
                <label className="full-field">Preferred dedication message<textarea name="dedication" required rows={4} placeholder="For Amelia—may every year bring you a new adventure. Love, Mum & Dad" /></label>
              </div>
            </fieldset>

            <fieldset className="consent-fieldset">
              <legend><span>04</span> Permission and privacy</legend>
              <label className="check-label"><input type="checkbox" name="permission" required /><span>I confirm that I am the child’s parent, guardian or an authorised adult, and I have permission to provide this information for the purpose of creating the purchased book.</span></label>
              <label className="check-label"><input type="checkbox" name="privacyAcknowledged" required /><span>I understand that the personalisation information and optional image will be used only to fulfil this order, in line with the <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>
              <label className="check-label marketing"><input type="checkbox" name="marketingConsent" /><span>Optional: send me occasional Birthday Hero Book news and offers by email. I can unsubscribe at any time.</span></label>
              <p>No marketing box is preselected. Marketing use of a child’s image or story would require separate, explicit permission and is not requested here.</p>
            </fieldset>

            {submitError && <p className="form-error" role="alert">{submitError}</p>}
            <button className="button button-primary form-submit" type="submit" disabled={submitting}>{submitting ? (isDemo ? "Saving your demo…" : "Sending securely…") : "Send My Personalisation Details"}</button>
            {isDemo ? <p className="demo-disclaimer">Demo mode: this form stores non-file fields only in this browser. It does not upload or send information anywhere.</p> : <p className="demo-disclaimer">Your details are sent securely and used only to fulfil your order.</p>}
          </form>
        </div>

        <aside className="order-summary">
          <span>Your chosen edition</span>
          <div className="summary-art"><Image src="/illustrations/adventure-world.png" alt="Sample birthday storybook" fill priority sizes="280px" /><b>{selectedPackage.name}</b></div>
          <div className="summary-package"><h2>{selectedPackage.name}</h2><strong>£{selectedPackage.price}</strong></div>
          <ul><li>✓ Personalised illustrated story</li><li>✓ High-resolution PDF</li><li>✓ Delivered within 5 working days</li></ul>
          <p><span aria-hidden="true">✦</span> Founding extra included: matching printable invitation set.</p>
          <a href={`mailto:${siteConfig.contactEmail}`}>Need help? {siteConfig.contactEmail}</a>
        </aside>
      </section>
    </main>
  );
}

export default function PersonalisePage() {
  return <Suspense fallback={<main className="form-page" aria-busy="true" />}><PersonalisePageContent /></Suspense>;
}
