"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MembershipStatusCard,
  type MembershipSummary,
} from "@/components/membership/MembershipStatusCard";
import { formatDate, formatDateTime } from "@/lib/format";
import { addNote, deleteNote } from "@/lib/members/actions";

export function MemberDetail({
  member,
  summary,
  attendance,
  notes,
  isAdmin,
}: {
  member: { id: string; name: string; email: string | null; avatarUrl: string | null };
  summary: MembershipSummary | null;
  attendance: {
    id: string;
    checkedInAt: string;
    sessionName: string;
    sessionDate: string | null;
  }[];
  notes: { id: string; body: string; createdAt: string; author: string; mine: boolean }[];
  isAdmin: boolean;
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [noteBody, setNoteBody] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Link href="/coach/members" className="text-xs text-ink-tertiary hover:underline">
          ← {t("coach.members.title")}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <Avatar url={member.avatarUrl} name={member.name} size="lg" />
          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold">{member.name}</h1>
            {member.email ? (
              <p className="break-words text-xs text-ink-tertiary">{member.email}</p>
            ) : null}
          </div>
        </div>
      </div>

      <MembershipStatusCard summary={summary} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("coach.member.notes")}
        </h2>
        <Card className="space-y-3">
          <p className="text-xs text-ink-tertiary">{t("coach.member.notesHint")}</p>
          {notes.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("coach.member.noNotes")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {notes.map((n) => (
                <li key={n.id} className="py-2.5">
                  <p className="break-words text-sm">{n.body}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-tertiary">
                      {n.author} · {formatDate(language, n.createdAt)}
                    </p>
                    {n.mine || isAdmin ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => deleteNote(n.id, member.id))
                        }
                      >
                        {t("coach.member.deleteNote")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex gap-2 border-t border-hairline pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const body = noteBody;
              setNoteBody("");
              startTransition(async () => {
                await addNote(member.id, body);
              });
            }}
          >
            <input
              className="flex-1 rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm placeholder:text-ink-tertiary focus:outline-none focus:shadow-[var(--focus-ring)]"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              required
            />
            <Button type="submit" disabled={pending || !noteBody.trim()}>
              {t("coach.member.addNote")}
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("coach.member.attendance")}
        </h2>
        <Card>
          {attendance.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("coach.member.noAttendance")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {attendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <p className="break-words text-sm">{a.sessionName}</p>
                  <p className="whitespace-nowrap text-xs text-ink-tertiary">
                    {formatDateTime(language, a.checkedInAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
