import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ReferralLinkBox } from "@/components/ReferralLinkBox";
import { PartnerOrdersTable } from "@/components/PartnerOrdersTable";
import { getAuthUser, isAdminEmail } from "@/lib/supabase-auth";
import {
  getAffiliateByAuthUserId,
  getAffiliateByEmail,
  getAffiliateStats,
  linkAuthUser,
} from "@/lib/affiliate-data";
import { getRequestOrigin } from "@/lib/request-origin";
import { siteConfig } from "@/lib/site-config";
import { signOut } from "../actions";
import "../../portal.css";

export const metadata: Metadata = {
  title: "Partner dashboard",
  robots: { index: false, follow: false },
};

// Never cache — a partner's figures should always be current.
export const dynamic = "force-dynamic";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function PortalHeader({ email }: { email: string }) {
  return (
    <div className="portal-top">
      <Brand />
      <div className="portal-top-meta">
        <span>{email}</span>
        <form action={signOut}>
          <button className="portal-signout" type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}

export default async function PartnerDashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/partners?next=/partners/dashboard");

  let affiliate = await getAffiliateByAuthUserId(user.id);
  if (!affiliate) {
    affiliate = await getAffiliateByEmail(user.email);
    if (affiliate && !affiliate.auth_user_id) await linkAuthUser(affiliate.id, user.id);
  }

  if (!affiliate) {
    return (
      <main className="portal">
        <PortalHeader email={user.email} />
        <div className="portal-shell portal-shell--narrow">
          <p className="portal-eyebrow">Partner portal</p>
          <h1>No partner account yet</h1>
          <p className="portal-lead">
            You’re signed in as <strong>{user.email}</strong>, but this address isn’t linked to a partner
            account. If you think this is a mistake, please contact us at {siteConfig.contactEmail}.
          </p>
          {isAdminEmail(user.email) && (
            <p className="portal-lead">
              <Link className="portal-back" href="/admin">Go to the admin dashboard →</Link>
            </p>
          )}
        </div>
      </main>
    );
  }

  const stats = await getAffiliateStats(affiliate.id);
  const origin = await getRequestOrigin();
  const referralLink = `${origin}/r/${affiliate.code}`;
  const ratePct = Math.round(Number(affiliate.commission_rate) * 100);

  return (
    <main className="portal">
      <PortalHeader email={user.email} />
      <div className="portal-shell">
        <p className="portal-eyebrow">Partner dashboard</p>
        <h1>Welcome, {affiliate.name}</h1>
        <p className="portal-lead">
          Share your referral link below — you earn {ratePct}% commission on every order made through it.
          {affiliate.status === "paused" &&
            " Your account is currently paused, so new referrals won’t be tracked. Please get in touch."}
        </p>

        <ReferralLinkBox link={referralLink} />

        <div className="portal-stats">
          <div className="portal-stat">
            <span>Link clicks</span>
            <b>{stats.clicks}</b>
            <small>All-time visits via your link</small>
          </div>
          <div className="portal-stat">
            <span>Orders</span>
            <b>{stats.conversions}</b>
            <small>Paid orders from your referrals</small>
          </div>
          <div className="portal-stat">
            <span>Commission owed</span>
            <b>{GBP.format(stats.commission.owed)}</b>
            <small>Pending + approved</small>
          </div>
          <div className="portal-stat">
            <span>Commission paid</span>
            <b>{GBP.format(stats.commission.paid)}</b>
            <small>Already paid out to you</small>
          </div>
        </div>

        <div className="portal-card">
          <h2>Your referred orders</h2>
          <PartnerOrdersTable orders={stats.orders} />
        </div>

        <p className="portal-note" style={{ marginTop: "22px" }}>
          Commission is confirmed once an order is complete and its refund period has passed, then paid out
          shortly after — this short wait simply makes sure every order is final and settled before commission
          is released. Questions about your earnings? Contact us at {siteConfig.contactEmail}.
        </p>
      </div>
    </main>
  );
}
