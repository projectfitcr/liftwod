import { requireUser } from "@/lib/auth/guards";
import { getBoard } from "@/lib/whiteboard/queries";
import { bangkokToday } from "@/lib/dates";
import { RealtimeRefresh } from "@/components/whiteboard/RealtimeRefresh";
import { WhiteboardDay } from "./WhiteboardDay";

export default async function WhiteboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireUser();
  const { date: dateParam } = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "")
    ? dateParam!
    : bangkokToday();

  const board = await getBoard(date);

  return (
    <>
      <RealtimeRefresh />
      <WhiteboardDay date={date} board={board} />
    </>
  );
}
