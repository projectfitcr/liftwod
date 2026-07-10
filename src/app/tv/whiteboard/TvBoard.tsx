"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Wordmark } from "@/components/shell/Wordmark";
import { WhiteboardBoard } from "@/components/whiteboard/WhiteboardBoard";
import { formatDate } from "@/lib/format";
import type { Board } from "@/lib/whiteboard/queries";

function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Bangkok",
        })
      );
    tick();
    const i = setInterval(tick, 10_000);
    return () => clearInterval(i);
  }, []);
  return <span className="tabular-nums text-4xl font-bold">{now}</span>;
}

export function TvBoard({ date, board }: { date: string; board: Board | null }) {
  const { t, language } = useLanguage();

  return (
    <div className="theme-tv min-h-dvh bg-canvas px-10 py-8 text-ink-primary">
      <div className="mb-8 flex items-center justify-between">
        <Wordmark className="text-5xl" />
        <div className="flex items-center gap-6">
          <span className="text-2xl text-ink-secondary">
            {formatDate(language, date)}
          </span>
          <Clock />
        </div>
      </div>

      {board ? (
        <WhiteboardBoard board={board} density="tv" />
      ) : (
        <p className="text-3xl text-ink-tertiary">{t("whiteboard.noWod")}</p>
      )}
    </div>
  );
}
