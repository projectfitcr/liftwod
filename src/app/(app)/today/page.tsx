import { requireUser } from "@/lib/auth/guards";
import { TodayView } from "./TodayView";

export default async function TodayPage() {
  const profile = await requireUser();
  return <TodayView name={profile.nickname || profile.full_name} />;
}
