import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getWodForDate, isHiddenFromMembers } from "@/lib/wods/queries";
import { WodDay } from "./WodDay";

export default async function WodDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const profile = await requireUser();
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const isStaff = profile.role === "admin" || profile.role === "coach";
  const wod = await getWodForDate(date); // RLS hides unrevealed from members

  return (
    <WodDay
      date={date}
      wod={wod}
      hidden={isStaff && wod ? isHiddenFromMembers(wod) : false}
    />
  );
}
