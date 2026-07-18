"use client";

import { useMemo, useState } from "react";
import { CommissionBadge } from "@/components/CommissionBadge";
import { siteConfig } from "@/lib/site-config";
import { COMMISSION_STATUSES } from "@/lib/commission";
import { approveAllPending, markApprovedPaid, updateOrderCommission } from "@/app/admin/actions";
import type { AffiliateWithStats } from "@/lib/affiliate-data";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const packageName = (id: string) => siteConfig.packages.find((item) => item.id === id)?.name ?? id;

type SortKey = "owed-desc" | "name-asc" | "clicks-desc" | "orders-desc";

// Partner list for the admin view, with client-side search + sort. Payout
// controls use the imported server actions, so mutations still run server-side
// (and re-check admin there).
export function AdminPartnerList({ affiliates }: { affiliates: AffiliateWithStats[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("owed-desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? affiliates.filter(
          (affiliate) =>
            affiliate.name.toLowerCase().includes(q) ||
            affiliate.code.toLowerCase().includes(q) ||
            affiliate.email.toLowerCase().includes(q),
        )
      : affiliates.slice();
    filtered.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "clicks-desc":
          return b.stats.clicks - a.stats.clicks;
        case "orders-desc":
          return b.stats.conversions - a.stats.conversions;
        case "owed-desc":
        default:
          return b.stats.commission.owed - a.stats.commission.owed;
      }
    });
    return filtered;
  }, [affiliates, query, sort]);

  if (affiliates.length === 0) {
    return (
      <div className="portal-card">
        <p className="portal-empty">
          No partners yet. Add an affiliate row in Supabase (with the partner’s email and referral code) to get
          started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="portal-toolbar">
        <input
          className="portal-search"
          type="search"
          placeholder="Search by name, code or email…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search partners"
        />
        <label className="portal-sort">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort partners">
            <option value="owed-desc">Amount owed (high–low)</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="clicks-desc">Clicks (high–low)</option>
            <option value="orders-desc">Orders (high–low)</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="portal-card">
          <p className="portal-empty">No partners match your search.</p>
        </div>
      ) : (
        rows.map((affiliate) => {
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
    </>
  );
}
