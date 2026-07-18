import type { CommissionStatus } from "@/lib/affiliate-data";

const LABELS: Record<CommissionStatus, string> = {
  none: "None",
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  reversed: "Reversed",
};

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  const key = (status in LABELS ? status : "none") as CommissionStatus;
  return <span className={`portal-badge portal-badge--${key}`}>{LABELS[key]}</span>;
}
