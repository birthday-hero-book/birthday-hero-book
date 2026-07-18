import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { requestMagicLink } from "./actions";
import "../portal.css";

export const metadata: Metadata = {
  title: "Partner sign in",
  robots: { index: false, follow: false },
};

type SearchParams = { sent?: string; error?: string; next?: string };

function safeNext(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export default async function PartnersSignInPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const next = safeNext(params.next);
  const errorMessage =
    params.error === "invalid"
      ? "Please enter a valid email address."
      : params.error === "link"
        ? "That sign-in link was invalid or has expired. Please request a new one."
        : params.error === "config"
          ? "Sign in is temporarily unavailable. Please try again shortly."
          : null;

  return (
    <main className="portal">
      <div className="portal-top">
        <Brand />
        <Link className="portal-back" href="/">Back to the website →</Link>
      </div>
      <div className="portal-shell portal-shell--narrow">
        <p className="portal-eyebrow">Partner portal</p>
        <h1>Partner sign in</h1>
        {sent ? (
          <div className="portal-success" role="status">
            <strong>Check your email</strong>
            If that address is registered as a Birthday Hero Book partner, we’ve sent a secure sign-in link. It expires shortly, so please use it soon.
          </div>
        ) : (
          <>
            <p className="portal-lead">
              Enter the email linked to your partner account and we’ll send a secure sign-in link — no password needed.
            </p>
            {errorMessage && (
              <p className="portal-error" role="alert">
                {errorMessage}
              </p>
            )}
            <form className="portal-form" action={requestMagicLink}>
              {next && <input type="hidden" name="next" value={next} />}
              <label className="portal-label">
                Email address
                <input
                  className="portal-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <button className="button button-primary" type="submit">
                Email me a sign-in link
              </button>
              <p className="portal-note">
                Partner accounts are set up by invitation. Interested in referring Birthday Hero Book? Just get in touch.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
