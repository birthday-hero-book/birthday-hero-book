"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, isAdminEmail } from "@/lib/supabase-auth";
import {
  bulkAdvanceCommissionForAffiliate,
  setOrderCommissionStatus,
  COMMISSION_STATUSES,
  type CommissionStatus,
} from "@/lib/affiliate-data";

// Defence in depth: every mutation re-checks the caller is a signed-in admin, so
// access never relies on the page guard alone.
async function requireAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return Boolean(user && isAdminEmail(user.email));
}

export async function approveAllPending(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const affiliateId = String(formData.get("affiliateId") || "");
  await bulkAdvanceCommissionForAffiliate(affiliateId, "pending", "approved");
  revalidatePath("/admin");
}

export async function markApprovedPaid(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const affiliateId = String(formData.get("affiliateId") || "");
  await bulkAdvanceCommissionForAffiliate(affiliateId, "approved", "paid");
  revalidatePath("/admin");
}

// Granular control for corrections and reversals on a single order.
export async function updateOrderCommission(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "") as CommissionStatus;
  if (!COMMISSION_STATUSES.includes(status)) return;
  await setOrderCommissionStatus(orderId, status);
  revalidatePath("/admin");
}
