import { requireStaff } from "@/lib/auth/guards";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { RealtimeRefresh } from "@/components/whiteboard/RealtimeRefresh";
import { getBoard } from "@/lib/whiteboard/queries";
import { bangkokToday } from "@/lib/dates";
import { isLanguage, type Language } from "@/lib/i18n";
import { TvBoard } from "./TvBoard";

/** Gym TV: the browser signs in once as a coach account; full-bleed dark
 *  board, big type, live via Realtime + poll. */
export default async function TvWhiteboardPage() {
  const profile = await requireStaff();
  const language: Language = isLanguage(profile.preferred_language)
    ? profile.preferred_language
    : "th";
  const date = bangkokToday();
  const board = await getBoard(date);

  return (
    <LanguageProvider initialLanguage={language}>
      <RealtimeRefresh pollMs={30000} />
      <TvBoard date={date} board={board} />
    </LanguageProvider>
  );
}
