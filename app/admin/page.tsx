import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { CommissionBadge } from "@/components/CommissionBadge";
import { getAuthUser, isAdminEmail } from "@/lib/supabase-auth";
import { listAffiliatesWithStats, COMMISSION_STATUSES } from "@/lib/affiliate-data";
import { siteConfig } from "@/lib/site-config";
import { signOut } from "../partners/actions";
import { approveAllPending, markApprovedPaid, updateOrderCommission } from "./actions";
import "../portal.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const packageName = (id: string) => siteConfig.packages.find((item) => item.id === id)?.name ?? id;

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
          Every partner’s traffic, conversions and commission. Use the payout controls to approve pending
          commission, then mark it as paid once you’ve sent the money.
        </p>

        <div className="portal-stats">
          <div className="portal-stat"><span>Partners</span><b>{affiliates.length}</b></div>
          <div className="portal-stat"><span>Total clicks</span><b>{totals.clicks}</b></div>
          <div className="portal-stat"><span>Total orders</span><b>{totals.conversions}</b></div>
          <div className="portal-stat"><span>Owed</span><b>{GBP.format(totals.owed)}</b><small>Pending + approved</small></div>
          <div className="portal-stat"><span>Paid</span><b>{GBP.format(totals.paid)}</b></div>
        </div>

        {affiliates.length === 0 ? (
          <div className="portal-card">
            <p className="portal-empty">
              No partners yet. Add an affiliate row in Supabase (with the partner’s email and referral code)
              to get started.
            </p>
          </div>
        ) : (
          affiliates.map((affiliate) => {
            const { stats } = affiliate;
            const ratePct = Math.round(Number(affiliate.commission_rate) * 100);
            return (
              <div className="portal-card" key={affiliate.id}>
                <div className="portal-partner-head">
                  <h2>
                    {affiliate.name}
                    {affiliate.status === "paused" && (
                      <span className="portal-badge portal-badge--none">Paused</span>
                    )}
                  </h2>
                  <p className="portal-note">
                    /r/{affiliate.code} · {affiliate.email} · {ratePct}% commission
                  </p>
                </div>

                <div className="portal-stats">
                  <div className="portal-stat"><span>Clicks</span><b>{stats.clicks}</b></div>
                  <div className="portal-stat"><span>Orders</span><b>{stats.conversions}</b></div>
                  <div className="portal-stat"><span>Pending</span><b>{GBP.format(stats.commission.pending)}</b></div>
                  <div className="portal-stat"><span>Approved</span><b>{GBP.format(stats.commission.approved)}</b></div>
                  <div className="portal-stat"><span>Paid</span><b>{GBP.format(stats.commission.paid)}</b></div>
                </div>

                <div className="portal-actions">
                  <form action={approveAllPending}>
                    <input type="hidden" name="affiliateId" value={affiliate.id} />
                    <button className="portal-btn" type="submit" disabled={stats.commission.pending <= 0}>
                      Approve pending ({GBP.format(stats.commission.pending)})
                    </button>
                  </form>
                  <form action={markApprovedPaid}>
                    <input type="hidden" name="affiliateId" value={affiliate.id} />
                    <button className="portal-btn portal-btn--primary" type="submit" disabled={stats.commission.approved <= 0}>
                      Mark approved as paid ({GBP.format(stats.commission.approved)})
                    </button>
                  </form>
                </div>

                {stats.orders.length > 0 && (
                  <details className="portal-details">
                    <summary>
                      {stats.orders.length} referred order{stats.orders.length === 1 ? "" : "s"} — view &amp; adjust
                    </summary>
                    <div className="portal-table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Edition</th>
                            <th className="portal-th-num">Commission</th>
                            <th>Status</th>
                            <th>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.orders.map((order) => (
                            <tr key={order.id}>
                              <td>{DATE.format(new Date(order.submitted_at))}</td>
                              <td>{packageName(order.package_id)}</td>
                              <td className="portal-num">{GBP.format(Number(order.commission_amount ?? 0))}</td>
                              <td><CommissionBadge status={order.commission_status} /></td>
                              <td>
                                <form className="portal-inline-form" action={updateOrderCommission}>
                                  <input type="hidden" name="orderId" value={order.id} />
                                  <select
                                    className="portal-select"
                                    name="status"
                                    defaultValue={order.commission_status}
                                    aria-label="Commission status"
                                  >
                                    {COMMISSION_STATUSES.map((status) => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                  <button className="portal-btn portal-btn--ghost" type="submit">Update</button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
