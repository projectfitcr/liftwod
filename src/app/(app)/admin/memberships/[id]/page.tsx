import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembershipDetail } from "./MembershipDetail";

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: summary }, { data: payments }, { data: holds }] = await Promise.all([
    supabase.from("membership_summaries").select("*").eq("id", id).single(),
    supabase
      .from("payments")
      .select("*")
      .eq("membership_id", id)
      .order("paid_on", { ascending: false }),
    supabase
      .from("holds")
      .select("*")
      .eq("membership_id", id)
      .order("starts_on", { ascending: false }),
  ]);
  if (!summary) notFound();

  const { data: member } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", summary.member_id!)
    .single();

  return (
    <MembershipDetail
      summary={summary}
      memberName={member?.full_name || member?.email || "—"}
      payments={payments ?? []}
      holds={holds ?? []}
    />
  );
}
