"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { createExercise, setExerciseActive } from "@/lib/wods/actions";
import { localizedName, type LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
type Category = Database["public"]["Enums"]["exercise_category"];

const CATEGORIES: Category[] = [
  "squat", "hinge", "press", "pull", "olympic_lift",
  "gymnastics", "monostructural", "core", "other",
];

export function ExercisesAdmin({ exercises }: { exercises: Exercise[] }) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nameEn: "",
    nameTh: "",
    category: "other" as Category,
    demoUrl: "",
    isTrackedLift: false,
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? exercises.filter(
        (e) =>
          e.name_en.toLowerCase().includes(q) || (e.name_th ?? "").includes(search.trim())
      )
    : exercises;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("coach.exercises.title")}</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {t("coach.exercises.add")}
        </Button>
      </div>

      {showForm ? (
        <Card>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const res = await createExercise(form);
                if (res.ok) {
                  setShowForm(false);
                  setForm({ ...form, nameEn: "", nameTh: "", demoUrl: "" });
                }
              });
            }}
          >
            <Field
              label={t("coach.exercises.nameEn")}
              required
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
            <Field
              label={t("coach.exercises.nameTh")}
              value={form.nameTh}
              onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("coach.exercises.category")}
              </span>
              <select
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`cat.${c}` as LocaleKey)}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={t("coach.exercises.demoUrl")}
              type="url"
              value={form.demoUrl}
              onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isTrackedLift}
                onChange={(e) => setForm({ ...form, isTrackedLift: e.target.checked })}
              />
              {t("coach.exercises.trackedLift")}
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? t("common.loading") : t("coach.exercises.add")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <input
        className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm placeholder:text-ink-tertiary focus:outline-none focus:shadow-[var(--focus-ring)]"
        placeholder={t("coach.exercises.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        <ul className="divide-y divide-hairline">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {localizedName(language, e)}
                  {language === "th" && e.name_th ? (
                    <span className="ml-2 text-xs text-ink-tertiary">{e.name_en}</span>
                  ) : e.name_th ? (
                    <span className="ml-2 text-xs text-ink-tertiary">{e.name_th}</span>
                  ) : null}
                  {!e.is_active ? (
                    <span className="ml-2 align-middle">
                      <Pill tone="danger">{t("coach.exercises.retired")}</Pill>
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-ink-tertiary">
                  {t(`cat.${e.category}` as LocaleKey)}
                  {e.is_tracked_lift ? ` · ${t("coach.exercises.trackedLift")}` : ""}
                  {e.demo_url ? " · ▶" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => startTransition(() => setExerciseActive(e.id, !e.is_active))}
              >
                {e.is_active ? t("coach.exercises.retire") : t("coach.exercises.restore")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
