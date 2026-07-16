import { requireStaff } from "@/lib/auth/guards";
import { getSessionViews } from "@/lib/schedule/queries";
import { bangkokToday } from "@/lib/dates";
import { CoachHome } from "./CoachHome";

export default async function CoachHomePage() {
  const profile = await requireStaff();
  const today = bangkokToday();
  const days = await getSessionViews(today, today, profile.id);

  return <CoachHome sessions={days[0]?.sessions ?? []} />;
}
