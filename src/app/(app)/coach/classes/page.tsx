import { requireStaff } from "@/lib/auth/guards";
import { getSessionViews } from "@/lib/schedule/queries";
import { addDays, bangkokToday, weekStartOf } from "@/lib/dates";
import { CoachClasses } from "./CoachClasses";

export default async function CoachClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const profile = await requireStaff();
  const { week } = await searchParams;
  const today = bangkokToday();
  const weekStart = weekStartOf(
    /^\d{4}-\d{2}-\d{2}$/.test(week ?? "") ? week! : today,
  );
  const days = await getSessionViews(
    weekStart,
    addDays(weekStart, 6),
    profile.id,
  );

  return <CoachClasses weekStart={weekStart} days={days} />;
}
