"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PlanType = Database["public"]["Enums"]["plan_type"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

function revalidate(membershipId?: string) {
  revalidatePath("/admin/people");
  revalidatePath("/admin/memberships");
  if (membershipId) revalidatePath(`/admin/memberships/${membershipId}`);
}

/** "2026-07-10" + 1 month → "2026-08-10" (clamped to month end, Bangkok-date
 *  string arithmetic — no timezones involved). */
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export async function createPlan(input: {
  nameEn: string;
  nameTh: string;
  planType: PlanType;
  priceThb: number;
  durationMonths?: number;
  weeklyVisitLimit?: number;
  visitCount?: number;
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const isPeriod = input.planType === "unlimited" || input.planType === "weekly_limited";
  const { error } = await supabase.from("membership_plans").insert({
    name_en: input.nameEn,
    name_th: input.nameTh,
    plan_type: input.planType,
    price_thb: input.priceThb,
    duration_months: isPeriod ? (input.durationMonths ?? 1) : null,
    weekly_visit_limit: input.planType === "weekly_limited" ? input.weeklyVisitLimit : null,
    visit_count: !isPeriod ? (input.visitCount ?? (input.planType === "drop_in" ? 1 : 10)) : null,
    sort_order: 99,
  });
  revalidatePath("/admin/plans");
  return { ok: !error, message: error?.message };
}

export async function setPlanActive(planId: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.from("membership_plans").update({ is_active: isActive }).eq("id", planId);
  revalidatePath("/admin/plans");
}

export async function createMembership(input: {
  memberId: string;
  planId: string;
  startDate: string; // yyyy-mm-dd
  payment?: { amountThb: number; paidOn: string; method: PaymentMethod; note?: string };
}) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("id", input.planId)
    .single();
  if (!plan) return { ok: false as const };

  const isPeriod = plan.plan_type === "unlimited" || plan.plan_type === "weekly_limited";
  const { data: membership, error } = await supabase
    .from("memberships")
    .insert({
      member_id: input.memberId,
      plan_id: input.planId,
      start_date: input.startDate,
      end_date: isPeriod ? addMonths(input.startDate, plan.duration_months ?? 1) : null,
      visits_remaining: isPeriod ? null : plan.visit_count,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !membership) return { ok: false as const };

  if (input.payment) {
    await supabase.from("payments").insert({
      membership_id: membership.id,
      amount_thb: input.payment.amountThb,
      paid_on: input.payment.paidOn,
      method: input.payment.method,
      note: input.payment.note || null,
      recorded_by: admin.id,
    });
  }

  revalidate(membership.id);
  return { ok: true as const, membershipId: membership.id };
}

/** Period plans: payment + end-date extension, atomic (RPC). */
export async function recordRenewal(
  membershipId: string,
  input: { amountThb: number; paidOn: string; method: PaymentMethod; note?: string }
) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_record_renewal", {
    p_membership_id: membershipId,
    p_amount_thb: input.amountThb,
    p_paid_on: input.paidOn,
    p_method: input.method,
    p_note: input.note || undefined,
  });
  revalidate(membershipId);
  const result = data as { ok: boolean; code: string } | null;
  return { ok: !error && !!result?.ok, code: result?.code };
}

/** Plain payment record (packs, drop-ins, corrections) — no date change. */
export async function recordPayment(
  membershipId: string,
  input: { amountThb: number; paidOn: string; method: PaymentMethod; note?: string }
) {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("payments").insert({
    membership_id: membershipId,
    amount_thb: input.amountThb,
    paid_on: input.paidOn,
    method: input.method,
    note: input.note || null,
    recorded_by: admin.id,
  });
  revalidate(membershipId);
  return { ok: !error };
}

export async function createHold(
  membershipId: string,
  input: { startsOn: string; endsOn: string; reason?: string }
) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_create_hold", {
    p_membership_id: membershipId,
    p_starts_on: input.startsOn,
    p_ends_on: input.endsOn,
    p_reason: input.reason || undefined,
  });
  revalidate(membershipId);
  const result = data as { ok: boolean; code: string } | null;
  return { ok: !error && !!result?.ok, code: result?.code };
}

export async function deleteHold(holdId: string, membershipId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("admin_delete_hold", { p_hold_id: holdId });
  revalidate(membershipId);
}

export async function cancelMembership(membershipId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("memberships")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", membershipId);
  revalidate(membershipId);
}
