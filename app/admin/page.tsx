import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AdminPartnerList } from "@/components/AdminPartnerList";
import { getAuthUser, isAdminEmail } from "@/lib/supabase-auth";
import { listAffiliatesWithStats } from "@/lib/affiliate-data";
import { signOut } from "../partners/actions";
import "../portal.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default async function AdminPage() {
  const user = await getAuthUser();
  if (!user) redirect("/partners?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/partners/dashboard");

  const affiliates = await listAffiliatesWithStats();

  const totals = affiliates.reduce(
    (acc, affiliate) => {
      acc.clicks += affiliate.stats.clicks;
      acc.conversions += affiliate.stats.conversions;
      acc.owed += affiliate.stats.commission.owed;
      acc.paid += affiliate.stats.commission.paid;
      return acc;
    },
    { clicks: 0, conversions: 0, owed: 0, paid: 0 },
  );

  return (
    <main className="portal">
      <div className="portal-top">
        <Brand />
        <div className="portal-top-meta">
          <span>{user.email}</span>
          <form action={signOut}>
            <button className="portal-signout" type="submit">Sign out</button>
          </form>
        </div>
      </div>
      <div className="portal-shell">
        <p className="portal-eyebrow">Admin</p>
        <h1>Affiliate overview</h1>
        <p className="portal-lead">
          Every partner’s traffic, conversions and commission. Approve pending commission, then mark it as paid
          once you’ve sent the money — best done only after each order’s refund window has passed, so you’re
          paying on settled, final orders.
        </p>

        <div className="portal-stats">
          <div className="portal-stat"><span>Partners</span><b>{affiliates.length}</b></div>
          <div className="portal-stat"><span>Total clicks</span><b>{totals.clicks}</b></div>
          <div className="portal-stat"><span>Total orders</span><b>{totals.conversions}</b></div>
          <div className="portal-stat"><span>Owed</span><b>{GBP.format(totals.owed)}</b><small>Pending + approved</small></div>
          <div className="portal-stat"><span>Paid</span><b>{GBP.format(totals.paid)}</b></div>
        </div>

        <AdminPartnerList affiliates={affiliates} />
      </div>
    </main>
  );
}
