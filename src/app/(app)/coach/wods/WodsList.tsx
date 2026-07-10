"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate } from "@/lib/format";
import { copyWorkout, createWorkout } from "@/lib/wods/actions";

export function WodsList({
  workouts,
}: {
  workouts: {
    id: string;
    title: string;
    scheduledOn: string | null;
    published: boolean;
    benchmarkName: string | null;
  }[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("coach.wods.title")}</h1>
          <Link
            href="/coach/exercises"
            className="text-xs text-primary-ink hover:underline"
          >
            {t("coach.exercises.title")} →
          </Link>
        </div>
        <Button disabled={pending} onClick={() => startTransition(() => createWorkout())}>
          {t("coach.wods.new")}
        </Button>
      </div>

      <Card>
        {workouts.length === 0 ? (
          <p className="text-sm text-ink-tertiary">{t("coach.wods.none")}</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/coach/wods/${w.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="break-words text-sm font-medium">
                    {w.title}
                    {w.benchmarkName ? (
                      <span className="ml-2 align-middle">
                        <Pill tone="accent">{w.benchmarkName}</Pill>
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-tertiary">
                    {w.scheduledOn
                      ? formatDate(language, w.scheduledOn)
                      : t("coach.wods.unscheduled")}
                    {" · "}
                    {w.published ? t("coach.wods.published") : t("wod.draft")}
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => startTransition(() => copyWorkout(w.id))}
                >
                  {t("coach.wods.copy")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
