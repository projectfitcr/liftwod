"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import {
  StatusPill,
  PlanRule,
  planName,
  type MembershipStatus,
} from "@/components/membership/helpers";
import { formatDate, formatNumber, formatTHB } from "@/lib/format";
import { createMembership } from "@/lib/memberships/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type Summary = Database["public"]["Views"]["membership_summaries"]["Row"] & {
  member_name: string;
};
type Person = { id: string; full_name: string; nickname: string | null; email: string | null };
type Plan = Database["public"]["Tables"]["membership_plans"]["Row"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const METHODS: PaymentMethod[] = ["cash", "transfer", "promptpay", "other"];
const FILTERS: (MembershipStatus | "all")[] = ["all", "active", "expiring_soon", "expired", "on_hold"];

function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function MembershipsAdmin({
  rows,
  people,
  plans,
}: {
  rows: Summary[];
  people: Person[];
  plans: Plan[];
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<MembershipStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(bangkokToday());
  const [withPayment, setWithPayment] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const selectedPlan = plans.find((p) => p.id === planId);
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !planId) return;
    startTransition(async () => {
      const res = await createMembership({
        memberId,
        planId,
        startDate,
        payment: withPayment
          ? {
              amountThb: Number(amount) || selectedPlan?.price_thb || 0,
              paidOn: bangkokToday(),
              method,
            }
          : undefined,
      });
      if (res.ok && res.membershipId) {
        setShowForm(false);
        router.push(`/admin/memberships/${res.membershipId}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("admin.memberships.title")}</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {t("admin.memberships.new")}
        </Button>
      </div>

      {showForm ? (
        <Card>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.memberships.member")}
              </span>
              <select
                required
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="" />
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.memberships.plan")}
              </span>
              <select
                required
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {planName(language, p)} — {formatTHB(language, p.price_thb)}
                  </option>
                ))}
              </select>
              {selectedPlan ? (
                <span className="mt-1 block">
                  <PlanRule plan={selectedPlan} />
                </span>
              ) : null}
            </label>
            <Field
              label={t("admin.memberships.startDate")}
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm text-ink-secondary">
                <input
                  type="checkbox"
                  checked={withPayment}
                  onChange={(e) => setWithPayment(e.target.checked)}
                />
                {t("admin.memberships.recordPaymentNow")}
              </label>
              {withPayment ? (
                <div className="flex gap-2">
                  <Field
                    label={t("admin.membership.amount")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder={String(selectedPlan?.price_thb ?? "")}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <label className="block flex-1">
                    <span className="mb-1 block text-sm font-medium text-ink-secondary">
                      {t("admin.membership.methodLabel")}
                    </span>
                    <select
                      className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                      value={method}
                      onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    >
                      {METHODS.map((m) => (
                        <option key={m} value={m}>
                          {t(`method.${m}` as LocaleKey)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending || !memberId}>
                {pending ? t("common.loading") : t("admin.memberships.create")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary-soft text-primary-ink"
                : "bg-surface text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            {f === "all" ? t("admin.memberships.all") : t(`status.${f}` as LocaleKey)}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-sm text-ink-tertiary">{t("admin.memberships.none")}</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/memberships/${r.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-row-hover"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {r.member_name}
                      {r.cancelled_at ? (
                        <span className="ml-2 align-middle">
                          <Pill tone="danger">{t("admin.memberships.cancelled")}</Pill>
                        </span>
                      ) : null}
                    </p>
                    <p className="break-words text-xs text-ink-tertiary">
                      {planName(language, { name_en: r.plan_name_en, name_th: r.plan_name_th })}
                      {r.end_date
                        ? ` · ${t("admin.memberships.endDate")} ${formatDate(language, r.end_date)}`
                        : r.visits_remaining != null
                          ? ` · ${t("admin.memberships.visitsLeft", { count: formatNumber(language, r.visits_remaining) })}`
                          : ""}
                    </p>
                  </div>
                  {r.status ? <StatusPill status={r.status} /> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
