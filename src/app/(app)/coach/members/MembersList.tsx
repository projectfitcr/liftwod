"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatDate } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";

const ROLE_KEY = {
  admin: "admin.users.role.admin",
  coach: "admin.users.role.coach",
  member: "admin.users.role.member",
} as const;

type Filter = "members" | "all" | "atRisk" | "active" | "new";

type MemberRow = {
  id: string;
  name: string;
  role: "admin" | "coach" | "member";
  avatarUrl: string | null;
  lastAttended: string | null;
  createdAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function MembersList({
  rows,
  nowIso,
}: {
  rows: MemberRow[];
  nowIso: string;
}) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("members");
  const now = new Date(nowIso).getTime();
  const twoWeeksAgo = now - 14 * DAY_MS;
  const oneWeekAgo = now - 7 * DAY_MS;
  const oneMonthAgo = now - 30 * DAY_MS;
  const filters: Filter[] = ["members", "atRisk", "active", "new", "all"];

  const visible = rows.filter((row) => {
    const matchesSearch = row.name
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (row.role !== "member") return false;
    if (filter === "members") return true;
    if (filter === "atRisk") {
      return (
        !row.lastAttended || new Date(row.lastAttended).getTime() < twoWeeksAgo
      );
    }
    if (filter === "active") {
      return (
        row.lastAttended != null &&
        new Date(row.lastAttended).getTime() >= oneWeekAgo
      );
    }
    return new Date(row.createdAt).getTime() >= oneMonthAgo;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("coach.members.title")}</h1>
        <p className="mt-1 text-sm text-ink-tertiary">
          {t("admin.dashboard.atRisk")}:{" "}
          {
            rows.filter(
              (row) =>
                row.role === "member" &&
                (!row.lastAttended ||
                  new Date(row.lastAttended).getTime() < twoWeeksAgo),
            ).length
          }
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("coach.members.search")}
        className="min-h-11 w-full rounded-xl border border-hairline bg-surface px-4 text-sm text-ink-primary outline-none placeholder:text-ink-tertiary focus:shadow-[var(--focus-ring)]"
      />

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
              filter === item
                ? "bg-primary-soft text-primary-ink"
                : "border border-hairline bg-surface text-ink-secondary"
            }`}
          >
            {t(`coach.members.filter.${item}` as LocaleKey)}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-tertiary">
            {t("coach.members.noMatches")}
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {visible.map((row) => {
              const lagging =
                row.role === "member" &&
                (!row.lastAttended ||
                  new Date(row.lastAttended).getTime() < twoWeeksAgo);
              return (
                <li key={row.id}>
                  <Link
                    href={`/coach/members/${row.id}`}
                    className="flex min-h-16 items-center gap-3 px-4 py-2 hover:bg-row-hover"
                  >
                    <Avatar url={row.avatarUrl} name={row.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">
                        {row.name}
                        {row.role !== "member" ? (
                          <span className="ml-2 align-middle">
                            <Pill tone="info">{t(ROLE_KEY[row.role])}</Pill>
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        {row.lastAttended
                          ? t("coach.members.lastAttended", {
                              date: formatDate(language, row.lastAttended),
                            })
                          : t("coach.members.never")}
                      </p>
                    </div>
                    {lagging ? (
                      <Pill tone="warning">
                        {t("coach.members.lagFlag", { days: 14 })}
                      </Pill>
                    ) : (
                      <span aria-hidden className="text-ink-tertiary">
                        →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
