import { requireUser } from "@/lib/auth/guards";
import { getSessionViews } from "@/lib/schedule/queries";
import { addDays, bangkokToday } from "@/lib/dates";
import { ScheduleView } from "./ScheduleView";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; week?: string }>;
}) {
  const profile = await requireUser();
  const { start, week } = await searchParams;

  const today = bangkokToday();
  const requestedStart = start ?? week;
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedStart ?? "")
    ? requestedStart!
    : today;
  const days = await getSessionViews(
    startDate,
    addDays(startDate, 13),
    profile.id,
  );

  return (
    <ScheduleView
      userId={profile.id}
      startDate={startDate}
      today={today}
      days={days}
      isStaff={profile.role === "admin" || profile.role === "coach"}
      nowIso={new Date().toISOString()}
    />
  );
}
