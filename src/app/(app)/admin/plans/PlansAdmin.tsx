"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { PlanRule, planName, type PlanType } from "@/components/membership/helpers";
import { formatTHB } from "@/lib/format";
import { createPlan, setPlanActive } from "@/lib/memberships/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type Plan = Database["public"]["Tables"]["membership_plans"]["Row"];

const PLAN_TYPES: PlanType[] = ["unlimited", "weekly_limited", "visit_pack", "drop_in"];

export function PlansAdmin({ plans }: { plans: Plan[] }) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nameEn: "",
    nameTh: "",
    planType: "unlimited" as PlanType,
    priceThb: "",
    durationMonths: "1",
    weeklyVisitLimit: "3",
    visitCount: "10",
  });

  const isPeriod = form.planType === "unlimited" || form.planType === "weekly_limited";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPlan({
        nameEn: form.nameEn,
        nameTh: form.nameTh,
        planType: form.planType,
        priceThb: Number(form.priceThb),
        durationMonths: Number(form.durationMonths) || 1,
        weeklyVisitLimit: Number(form.weeklyVisitLimit) || 3,
        visitCount: Number(form.visitCount) || 1,
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ ...form, nameEn: "", nameTh: "", priceThb: "" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin.plans.title")}</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {t("admin.plans.new")}
        </Button>
      </div>

      <p className="text-xs text-ink-tertiary">{t("admin.plans.immutable")}</p>

      {showForm ? (
        <Card>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("admin.plans.nameEn")}
              required
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
            <Field
              label={t("admin.plans.nameTh")}
              required
              value={form.nameTh}
              onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.plans.type")}
              </span>
              <select
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={form.planType}
                onChange={(e) => setForm({ ...form, planType: e.target.value as PlanType })}
              >
                {PLAN_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`plan.type.${pt}` as LocaleKey)}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={t("admin.plans.price")}
              type="number"
              inputMode="numeric"
              min={0}
              required
              value={form.priceThb}
              onChange={(e) => setForm({ ...form, priceThb: e.target.value })}
            />
            {isPeriod ? (
              <Field
                label={t("admin.plans.durationMonths")}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              />
            ) : (
              <Field
                label={t("admin.plans.visitCount")}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.visitCount}
                onChange={(e) => setForm({ ...form, visitCount: e.target.value })}
              />
            )}
            {form.planType === "weekly_limited" ? (
              <Field
                label={t("admin.plans.weeklyLimit")}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.weeklyVisitLimit}
                onChange={(e) => setForm({ ...form, weeklyVisitLimit: e.target.value })}
              />
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? t("common.loading") : t("admin.plans.create")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <ul className="divide-y divide-hairline">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  {planName(language, p)}
                  {!p.is_active ? (
                    <span className="ml-2 align-middle">
                      <Pill tone="danger">{t("admin.plans.retired")}</Pill>
                    </span>
                  ) : null}
                </p>
                <PlanRule plan={p} />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="whitespace-nowrap text-sm font-semibold">
                  {formatTHB(language, p.price_thb)}
                  {p.duration_months ? (
                    <span className="font-normal text-ink-tertiary"> {t("plan.perMonth")}</span>
                  ) : null}
                </span>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => startTransition(() => setPlanActive(p.id, !p.is_active))}
                >
                  {p.is_active ? t("admin.plans.retire") : t("admin.plans.reactivate")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
