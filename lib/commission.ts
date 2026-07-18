// Commission status vocabulary, kept in its own module (no server-only imports)
// so it can be shared by server code AND client components without pulling the
// service-role data layer into the browser bundle.

export const COMMISSION_STATUSES = ["none", "pending", "approved", "paid", "reversed"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  none: "None",
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  reversed: "Reversed",
};
