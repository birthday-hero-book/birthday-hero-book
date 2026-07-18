"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, isAdminEmail } from "@/lib/supabase-auth";
import {
  bulkAdvanceCommissionForAffiliate,
  setOrderCommissionStatus,
  createAffiliate,
  updateAffiliateSettings,
  getAffiliateByEmail,
  COMMISSION_STATUSES,
  type CommissionStatus,
} from "@/lib/affiliate-data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

// Percentage (0–100, one dp) -> fraction rounded to the numeric(5,4) column.
function percentToRate(percent: number): number {
  return Math.round(percent * 100) / 10000;
}

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

export type CreatePartnerState = { ok?: boolean; error?: string; message?: string };

// Add a new partner. Used with useActionState so the form can show validation
// and duplicate errors inline.
export async function createAffiliateAction(
  _prev: CreatePartnerState,
  formData: FormData,
): Promise<CreatePartnerState> {
  if (!(await requireAdmin())) return { error: "You’re not authorised to do that." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();
  const percent = Number(String(formData.get("rate") || "").trim());
  const status = String(formData.get("status") || "active");

  if (!name || name.length > 120) return { error: "Enter the partner’s name." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (!CODE_RE.test(code)) return { error: "The code can use letters, numbers, hyphens and underscores only — no spaces." };
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return { error: "Commission rate must be between 0 and 100%." };
  if (status !== "active" && status !== "paused") return { error: "Choose a valid status." };

  // Don’t let a second row quietly shadow an existing partner’s email.
  if (await getAffiliateByEmail(email)) return { error: "A partner with that email already exists." };

  const result = await createAffiliate({ name, email, code, commissionRate: percentToRate(percent), status });
  if (!result.ok) return { error: result.error ?? "Could not add the partner." };

  revalidatePath("/admin");
  return { ok: true, message: `${name} added — their link is /r/${code}.` };
}

// Adjust an existing partner's commission rate and active/paused status.
export async function updateAffiliateAction(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const affiliateId = String(formData.get("affiliateId") || "");
  const percent = Number(String(formData.get("rate") || "").trim());
  const status = String(formData.get("status") || "");
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
  if (status !== "active" && status !== "paused") return;
  await updateAffiliateSettings(affiliateId, { commissionRate: percentToRate(percent), status });
  revalidatePath("/admin");
}
