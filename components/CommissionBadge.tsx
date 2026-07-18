import { COMMISSION_STATUS_LABELS, type CommissionStatus } from "@/lib/commission";

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  const key = (status in COMMISSION_STATUS_LABELS ? status : "none") as CommissionStatus;
  return <span className={`portal-badge portal-badge--${key}`}>{COMMISSION_STATUS_LABELS[key]}</span>;
}
