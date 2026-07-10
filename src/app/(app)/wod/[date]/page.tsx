import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getMyResults, getWodForDate, isHiddenFromMembers } from "@/lib/wods/queries";
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
  const myResults = wod
    ? await getMyResults(
        wod.components.map((c) => c.id),
        profile.id
      )
    : {};

  return (
    <WodDay
      date={date}
      wod={wod}
      myResults={myResults}
      hidden={isStaff && wod ? isHiddenFromMembers(wod) : false}
    />
  );
}
