import { siteConfig } from "@/lib/site-config";

// Welcome email sent to a partner when they're added in the admin. Best-effort,
// like the order emails — never block partner creation on it.

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export type PartnerWelcomeStatus = "sent" | "skipped" | "failed";

export async function sendPartnerWelcome(input: {
  name: string;
  email: string;
  code: string;
  commissionRate: number; // fraction, e.g. 0.2
  origin: string;
}): Promise<PartnerWelcomeStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  // A partner-facing sender if set, otherwise reuse the orders sender.
  const from = process.env.PARTNER_EMAIL_FROM?.trim() || process.env.ORDER_NOTIFICATION_FROM?.trim();
  if (!apiKey || !from) return "skipped";

  const referralLink = `${input.origin}/r/${input.code}`;
  const signInLink = `${input.origin}/partners`;
  const ratePct = Math.round(input.commissionRate * 10000) / 100;
  const subject = "Welcome to the Birthday Hero Book partner programme";

  const text = [
    `Welcome aboard, ${input.name}!`,
    "",
    `You're all set up as a Birthday Hero Book partner. Share your personal referral link and you'll earn ${ratePct}% commission on every order made through it.`,
    "",
    `Your referral link: ${referralLink}`,
    "",
    "Sign in any time to see your clicks, orders and commission — no password needed, we email you a secure link:",
    signInLink,
    "",
    `Questions? Just reply to this email or contact ${siteConfig.contactEmail}.`,
    "",
    "With love,",
    "Birthday Hero Book",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#181714;max-width:560px;margin:0 auto;padding:8px">
      <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#ff5a3d;margin:0 0 14px;font-weight:700">Birthday Hero Book &middot; Partner programme</p>
      <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">Welcome aboard, ${escapeHtml(input.name)}!</h1>
      <p style="font-size:16px;margin:0 0 22px">You're all set up as a Birthday Hero Book partner. Share your personal referral link and you'll earn <strong>${ratePct}% commission</strong> on every order made through it.</p>
      <div style="background:#171c1c;border-radius:11px;padding:18px 20px;margin:0 0 24px">
        <p style="font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#aaa8a0;margin:0 0 8px">Your referral link</p>
        <p style="font-size:16px;font-weight:700;color:#ffffff;margin:0;word-break:break-all">${escapeHtml(referralLink)}</p>
      </div>
      <p style="font-size:15px;margin:0 0 24px">Sign in any time to see your clicks, orders and commission — no password needed, we email you a secure link.</p>
      <p style="margin:0 0 30px">
        <a href="${escapeHtml(signInLink)}" style="background:#ff5a3d;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px;display:inline-block">Sign in to my dashboard</a>
      </p>
      <p style="font-size:13px;color:#6b6860;margin:0">Questions? Just reply to this email or contact <a href="mailto:${escapeHtml(siteConfig.contactEmail)}" style="color:#181714">${escapeHtml(siteConfig.contactEmail)}</a>.</p>
      <p style="font-size:13px;color:#6b6860;margin:22px 0 0">With love,<br />Birthday Hero Book</p>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        reply_to: siteConfig.contactEmail,
        subject,
        html,
        text,
        tags: [{ name: "category", value: "partner_welcome" }],
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
