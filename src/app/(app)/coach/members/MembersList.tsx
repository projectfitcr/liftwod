"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";

const ROLE_KEY = {
  admin: "admin.users.role.admin",
  coach: "admin.users.role.coach",
  member: "admin.users.role.member",
} as const;

export function MembersList({
  rows,
}: {
  rows: {
    id: string;
    name: string;
    role: "admin" | "coach" | "member";
    lastAttended: string | null;
  }[];
}) {
  const { t, language } = useLanguage();
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("coach.members.title")}</h1>
      <Card>
        <ul className="divide-y divide-hairline">
          {rows.map((r) => {
            const lagging =
              !r.lastAttended || new Date(r.lastAttended).getTime() < twoWeeksAgo;
            return (
              <li key={r.id}>
                <Link
                  href={`/coach/members/${r.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-row-hover"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {r.name}
                      {r.role !== "member" ? (
                        <span className="ml-2 align-middle">
                          <Pill tone="info">{t(ROLE_KEY[r.role])}</Pill>
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink-tertiary">
                      {r.lastAttended
                        ? t("coach.members.lastAttended", {
                            date: formatDate(language, r.lastAttended),
                          })
                        : t("coach.members.never")}
                    </p>
                  </div>
                  {lagging ? (
                    <Pill tone="warning">{t("coach.members.lagFlag", { days: 14 })}</Pill>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
