import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/guards";
import { PendingCard } from "./PendingCard";

export default async function PendingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/sign-in");
  if (profile.approved_at && profile.is_active) redirect("/today");

  return <PendingCard email={profile.email ?? ""} />;
}
