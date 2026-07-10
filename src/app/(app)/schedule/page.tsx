import { requireUser } from "@/lib/auth/guards";
import { getSessionViews } from "@/lib/schedule/queries";
import { addDays, bangkokToday, weekStartOf } from "@/lib/dates";
import { WeekSchedule } from "./WeekSchedule";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const profile = await requireUser();
  const { week } = await searchParams;

  const today = bangkokToday();
  const weekStart = weekStartOf(/^\d{4}-\d{2}-\d{2}$/.test(week ?? "") ? week! : today);
  const days = await getSessionViews(weekStart, addDays(weekStart, 6), profile.id);

  return (
    <WeekSchedule
      weekStart={weekStart}
      today={today}
      days={days}
      currentWeekStart={weekStartOf(today)}
      isStaff={profile.role === "admin" || profile.role === "coach"}
    />
  );
}
