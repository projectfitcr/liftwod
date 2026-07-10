"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { StatusPill, PlanRule, planName } from "@/components/membership/helpers";
import { formatDate, formatNumber, formatTHB } from "@/lib/format";
import {
  cancelMembership,
  createHold,
  deleteHold,
  recordPayment,
  recordRenewal,
} from "@/lib/memberships/actions";
import type { LocaleKey } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/database.types";

type Summary = Database["public"]["Views"]["membership_summaries"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Hold = Database["public"]["Tables"]["holds"]["Row"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const METHODS: PaymentMethod[] = ["cash", "transfer", "promptpay", "other"];

function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function MembershipDetail({
  summary,
  memberName,
  payments,
  holds,
}: {
  summary: Summary;
  memberName: string;
  payments: Payment[];
  holds: Hold[];
}) {
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [holdError, setHoldError] = useState(false);

  const isPeriod = summary.plan_type === "unlimited" || summary.plan_type === "weekly_limited";

  const [amount, setAmount] = useState(String(summary.price_thb ?? ""));
  const [paidOn, setPaidOn] = useState(bangkokToday());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const [holdFrom, setHoldFrom] = useState(bangkokToday());
  const [holdTo, setHoldTo] = useState(bangkokToday());
  const [holdReason, setHoldReason] = useState("");

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const input = {
        amountThb: Number(amount),
        paidOn,
        method,
        note: note || undefined,
      };
      if (isPeriod) await recordRenewal(summary.id!, input);
      else await recordPayment(summary.id!, input);
      setNote("");
    });
  }

  function submitHold(e: React.FormEvent) {
    e.preventDefault();
    setHoldError(false);
    startTransition(async () => {
      const res = await createHold(summary.id!, {
        startsOn: holdFrom,
        endsOn: holdTo,
        reason: holdReason || undefined,
      });
      if (!res.ok) setHoldError(true);
      else setHoldReason("");
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/memberships" className="text-xs text-ink-tertiary hover:underline">
          ← {t("admin.memberships.title")}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <h1 className="break-words text-xl font-semibold">{memberName}</h1>
          {summary.status ? <StatusPill status={summary.status} /> : null}
        </div>
      </div>

      <Card className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-ink-tertiary">{t("admin.memberships.plan")}</span>
          <span className="break-words text-sm">
            {planName(language, { name_en: summary.plan_name_en, name_th: summary.plan_name_th })}
            {summary.cancelled_at ? (
              <span className="ml-2">
                <Pill tone="danger">{t("admin.memberships.cancelled")}</Pill>
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex justify-end">
          <PlanRule
            plan={{
              plan_type: summary.plan_type!,
              duration_months: null,
              weekly_visit_limit: summary.weekly_visit_limit,
              visit_count: summary.visit_count,
            }}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-ink-tertiary">{t("admin.memberships.startDate")}</span>
          <span className="whitespace-nowrap text-sm">{formatDate(language, summary.start_date)}</span>
        </div>
        {summary.end_date ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-ink-tertiary">{t("admin.memberships.endDate")}</span>
            <span className="whitespace-nowrap text-sm font-semibold">
              {formatDate(language, summary.end_date)}
            </span>
          </div>
        ) : null}
        {summary.visits_remaining != null ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-ink-tertiary">{t("profile.visitsRemaining")}</span>
            <span className="text-sm font-semibold">
              {formatNumber(language, summary.visits_remaining)}
            </span>
          </div>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.membership.payments")}
        </h2>
        <Card className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("admin.membership.noPayments")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm">
                      {formatTHB(language, p.amount_thb)}{" "}
                      <span className="text-xs text-ink-tertiary">
                        · {t(`method.${p.method}` as LocaleKey)}
                      </span>
                    </p>
                    {p.note ? (
                      <p className="break-words text-xs text-ink-tertiary">{p.note}</p>
                    ) : null}
                  </div>
                  <span className="whitespace-nowrap text-xs text-ink-tertiary">
                    {formatDate(language, p.paid_on)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!summary.cancelled_at ? (
            <form onSubmit={submitPayment} className="grid gap-2 border-t border-hairline pt-3 sm:grid-cols-4">
              <Field
                label={t("admin.membership.amount")}
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Field
                label={t("admin.membership.paidOn")}
                type="date"
                required
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
              />
              <label className="block">
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
              <Field
                label={t("admin.membership.noteLabel")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="sm:col-span-4">
                <Button type="submit" disabled={pending}>
                  {pending
                    ? t("common.loading")
                    : isPeriod
                      ? t("admin.membership.renew")
                      : t("admin.membership.addPayment")}
                </Button>
                {isPeriod ? (
                  <p className="mt-1 text-xs text-ink-tertiary">
                    {t("admin.membership.renewHint")}
                  </p>
                ) : null}
              </div>
            </form>
          ) : null}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          {t("admin.membership.holds")}
        </h2>
        <Card className="space-y-3">
          {holds.length === 0 ? (
            <p className="text-sm text-ink-tertiary">{t("admin.membership.noHolds")}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {holds.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-sm">
                      {formatDate(language, h.starts_on)} – {formatDate(language, h.ends_on)}
                    </p>
                    {h.reason ? (
                      <p className="break-words text-xs text-ink-tertiary">{h.reason}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() => startTransition(() => deleteHold(h.id, summary.id!))}
                  >
                    {t("admin.membership.removeHold")}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {!summary.cancelled_at ? (
            <form onSubmit={submitHold} className="grid gap-2 border-t border-hairline pt-3 sm:grid-cols-3">
              <Field
                label={t("admin.membership.holdFrom")}
                type="date"
                required
                value={holdFrom}
                onChange={(e) => setHoldFrom(e.target.value)}
              />
              <Field
                label={t("admin.membership.holdTo")}
                type="date"
                required
                value={holdTo}
                onChange={(e) => setHoldTo(e.target.value)}
              />
              <Field
                label={t("admin.membership.holdReason")}
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
              />
              {holdError ? (
                <p className="text-sm text-danger-ink sm:col-span-3">
                  {t("admin.membership.holdOverlap")}
                </p>
              ) : null}
              <div className="sm:col-span-3">
                <Button type="submit" variant="secondary" disabled={pending}>
                  {pending ? t("common.loading") : t("admin.membership.addHold")}
                </Button>
                <p className="mt-1 text-xs text-ink-tertiary">{t("admin.membership.holdHint")}</p>
              </div>
            </form>
          ) : null}
        </Card>
      </section>

      {!summary.cancelled_at ? (
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (window.confirm(t("admin.membership.cancelConfirm"))) {
              startTransition(() => cancelMembership(summary.id!));
            }
          }}
        >
          {t("admin.membership.cancel")}
        </Button>
      ) : null}
    </div>
  );
}
