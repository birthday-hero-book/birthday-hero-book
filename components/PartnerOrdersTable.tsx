"use client";

import { useMemo, useState } from "react";
import { CommissionBadge } from "@/components/CommissionBadge";
import { siteConfig } from "@/lib/site-config";
import type { AttributedOrder } from "@/lib/affiliate-data";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const packageName = (id: string) => siteConfig.packages.find((item) => item.id === id)?.name ?? id;

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "status";

// Read-only orders table for a partner's own referred orders, with client-side
// search + sort.
export function PartnerOrdersTable({ orders }: { orders: AttributedOrder[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? orders.filter(
          (order) =>
            packageName(order.package_id).toLowerCase().includes(q) ||
            order.commission_status.toLowerCase().includes(q),
        )
      : orders.slice();
    filtered.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.submitted_at.localeCompare(b.submitted_at);
        case "amount-desc":
          return Number(b.commission_amount ?? 0) - Number(a.commission_amount ?? 0);
        case "amount-asc":
          return Number(a.commission_amount ?? 0) - Number(b.commission_amount ?? 0);
        case "status":
          return a.commission_status.localeCompare(b.commission_status);
        case "date-desc":
        default:
          return b.submitted_at.localeCompare(a.submitted_at);
      }
    });
    return filtered;
  }, [orders, query, sort]);

  if (orders.length === 0) {
    return <p className="portal-empty">No referred orders yet. Share your link to get started!</p>;
  }

  return (
    <>
      <div className="portal-toolbar">
        <input
          className="portal-search"
          type="search"
          placeholder="Search by edition or status…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search orders"
        />
        <label className="portal-sort">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort orders">
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Commission (high–low)</option>
            <option value="amount-asc">Commission (low–high)</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="portal-empty">No orders match your search.</p>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Edition</th>
                <th className="portal-th-num">Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <td>{DATE.format(new Date(order.submitted_at))}</td>
                  <td>{packageName(order.package_id)}</td>
                  <td className="portal-num">{GBP.format(Number(order.commission_amount ?? 0))}</td>
                  <td>
                    <CommissionBadge status={order.commission_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
