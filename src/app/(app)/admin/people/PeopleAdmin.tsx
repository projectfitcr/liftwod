"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  PlanRule,
  StatusPill,
  planName,
} from "@/components/membership/helpers";
import { formatDate, formatTHB } from "@/lib/format";
import type { LocaleKey } from "@/lib/i18n";
import {
  approveUser,
  createInvite,
  deleteInvite,
  setUserActive,
  setUserRole,
} from "@/lib/admin/actions";
import { createMembership } from "@/lib/memberships/actions";
import type { Database } from "@/lib/supabase/database.types";
import { MembershipDetail } from "../memberships/[id]/MembershipDetail";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "nickname"
  | "email"
  | "role"
  | "approved_at"
  | "is_active"
  | "created_at"
  | "avatar_url"
>;
type Invite = Pick<
  Database["public"]["Tables"]["invites"]["Row"],
  "token" | "role" | "expires_at" | "used_at" | "created_at"
>;
type Membership = Database["public"]["Views"]["membership_summaries"]["Row"];
type Plan = Database["public"]["Tables"]["membership_plans"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Hold = Database["public"]["Tables"]["holds"]["Row"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];
type UserRole = Database["public"]["Enums"]["user_role"];

const METHODS: PaymentMethod[] = ["cash", "transfer", "promptpay", "other"];
const ROLE_KEY = {
  admin: "admin.users.role.admin",
  coach: "admin.users.role.coach",
  member: "admin.users.role.member",
} as const;

function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function membershipsFor(personId: string, memberships: Membership[]) {
  return memberships.filter((membership) => membership.member_id === personId);
}

export function PeopleAdmin({
  profiles,
  invites,
  memberships,
  plans,
  payments,
  holds,
  initialPersonId,
  initialMembershipId,
}: {
  profiles: Profile[];
  invites: Invite[];
  memberships: Membership[];
  plans: Plan[];
  payments: Payment[];
  holds: Hold[];
  initialPersonId?: string;
  initialMembershipId?: string;
}) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const waiting = profiles.filter((profile) => !profile.approved_at && profile.is_active);
  const defaultPersonId =
    profiles.find((profile) => profile.id === initialPersonId)?.id ??
    waiting[0]?.id ??
    profiles[0]?.id ??
    null;
  const defaultMembershipId =
    memberships.find(
      (membership) =>
        membership.id === initialMembershipId && membership.member_id === defaultPersonId,
    )?.id ??
    (defaultPersonId ? membershipsFor(defaultPersonId, memberships)[0]?.id : null) ??
    null;

  const [search, setSearch] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(defaultPersonId);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(
    defaultMembershipId,
  );
  const [showInvites, setShowInvites] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [roleError, setRoleError] = useState(false);
  const detailRef = useRef<HTMLElement>(null);

  const query = search.trim().toLocaleLowerCase();
  const filteredProfiles = query
    ? profiles.filter((profile) =>
        [profile.full_name, profile.nickname, profile.email]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(query)),
      )
    : profiles;
  const selectedPerson = profiles.find((profile) => profile.id === selectedPersonId) ?? null;
  const personMemberships = selectedPerson
    ? membershipsFor(selectedPerson.id, memberships)
    : [];
  const selectedMembership =
    personMemberships.find((membership) => membership.id === selectedMembershipId) ??
    personMemberships[0] ??
    null;

  function selectPerson(personId: string) {
    setSelectedPersonId(personId);
    setSelectedMembershipId(membershipsFor(personId, memberships)[0]?.id ?? null);
    setShowMembershipForm(false);
    setRoleError(false);
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function changeRole(profile: Profile, role: UserRole) {
    if (role === profile.role) return;
    if (role === "admin") {
      if (!window.confirm(t("admin.users.makeAdminConfirm", { name: profile.full_name || profile.email || "" })))
        return;
    } else if (profile.role === "admin") {
      if (!window.confirm(t("admin.users.demoteAdminConfirm", { name: profile.full_name || profile.email || "" })))
        return;
    }
    setRoleError(false);
    startTransition(async () => {
      const result = await setUserRole(profile.id, role);
      if (!result.ok && result.code === "LAST_ADMIN") setRoleError(true);
    });
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/sign-up?invite=${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.people.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-tertiary">
            {t("admin.people.subtitle")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowInvites((value) => !value)}>
          {t("admin.invites.title")}
          {invites.length > 0 ? ` (${invites.length})` : ""}
        </Button>
      </div>

      {showInvites ? (
        <InviteTools
          invites={invites}
          pending={pending}
          copied={copied}
          onCopy={copyInviteLink}
          onStart={startTransition}
        />
      ) : null}

      {waiting.length > 0 ? (
        <Card className="border-warning/50 bg-warning-soft/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-warning-ink">
                {t("admin.users.pending")}
              </h2>
              <p className="mt-0.5 text-xs text-ink-tertiary">
                {t("admin.people.pendingHint", { count: waiting.length })}
              </p>
            </div>
            <Pill tone="warning">{waiting.length}</Pill>
          </div>
          <div className="space-y-2">
            {waiting.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3 py-2"
              >
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() => selectPerson(profile.id)}
                >
                  <Avatar
                    url={profile.avatar_url}
                    name={profile.full_name || profile.email || "?"}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium">
                      {profile.full_name || profile.email}
                    </span>
                    <span className="block break-words text-xs text-ink-tertiary">
                      {profile.email}
                    </span>
                  </span>
                </button>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => approveUser(profile.id).then(() => {}))}
                >
                  {t("admin.users.approve")}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.7fr)]">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-secondary">
              {t("admin.users.everyone")}
            </h2>
            <p className="mt-0.5 text-xs text-ink-tertiary">
              {t("admin.people.total", { count: profiles.length })}
            </p>
          </div>
          <input
            className="w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-sm placeholder:text-ink-tertiary focus:outline-none focus:shadow-[var(--focus-ring)]"
            placeholder={t("admin.people.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Card className="max-h-[45dvh] overflow-y-auto p-2 lg:max-h-[65dvh]">
            {filteredProfiles.length === 0 ? (
              <p className="p-2 text-sm text-ink-tertiary">{t("admin.people.noMatches")}</p>
            ) : (
              <ul className="space-y-1">
                {filteredProfiles.map((profile) => {
                  const currentMembership = membershipsFor(profile.id, memberships).find(
                    (membership) => !membership.cancelled_at,
                  );
                  const selected = profile.id === selectedPersonId;
                  return (
                    <li key={profile.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectPerson(profile.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors ${
                          selected ? "bg-primary-soft" : "hover:bg-row-hover"
                        }`}
                      >
                        <Avatar
                          url={profile.avatar_url}
                          name={profile.full_name || profile.email || "?"}
                          size="md"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-medium">
                            {profile.full_name || profile.email}
                          </span>
                          <span className="block break-words text-xs text-ink-tertiary">
                            {profile.email}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            {!profile.approved_at ? (
                              <Pill tone="warning">{t("admin.people.pendingShort")}</Pill>
                            ) : !profile.is_active ? (
                              <Pill tone="danger">{t("admin.users.inactive")}</Pill>
                            ) : (
                              <Pill tone={profile.role === "admin" ? "accent" : profile.role === "coach" ? "info" : "neutral"}>
                                {t(ROLE_KEY[profile.role])}
                              </Pill>
                            )}
                            {currentMembership?.status ? (
                              <StatusPill status={currentMembership.status} />
                            ) : null}
                          </span>
                        </span>
                        <span aria-hidden className="text-ink-tertiary">→</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        <section ref={detailRef} className="scroll-mt-20">
          {selectedPerson ? (
            <div className="space-y-4">
              <PersonHeader profile={selectedPerson} />
              <AccountTools
                profile={selectedPerson}
                pending={pending}
                roleError={roleError}
                onRoleChange={(role) => changeRole(selectedPerson, role)}
                onStart={startTransition}
              />

              <div className="space-y-3 border-t border-hairline pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{t("admin.people.membershipsPayments")}</h2>
                    <p className="mt-0.5 text-xs text-ink-tertiary">
                      {t("admin.people.membershipHint")}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setShowMembershipForm((value) => !value)}
                    disabled={!selectedPerson.approved_at || !selectedPerson.is_active}
                  >
                    {t("admin.memberships.new")}
                  </Button>
                </div>

                {showMembershipForm ? (
                  <NewMembershipForm
                    personId={selectedPerson.id}
                    plans={plans}
                    pending={pending}
                    onStart={startTransition}
                    onCreated={(membershipId) => {
                      setSelectedMembershipId(membershipId);
                      setShowMembershipForm(false);
                      router.refresh();
                    }}
                  />
                ) : null}

                {personMemberships.length === 0 ? (
                  <Card>
                    <p className="text-sm text-ink-tertiary">
                      {t("admin.people.noMemberships")}
                    </p>
                  </Card>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {personMemberships.map((membership) => (
                      <button
                        key={membership.id}
                        type="button"
                        aria-pressed={membership.id === selectedMembership?.id}
                        onClick={() => setSelectedMembershipId(membership.id)}
                        className={`min-w-48 rounded-xl border p-3 text-left transition-colors ${
                          membership.id === selectedMembership?.id
                            ? "border-primary bg-primary-soft/40"
                            : "border-hairline bg-surface hover:border-primary/40"
                        }`}
                      >
                        <span className="block break-words text-sm font-semibold">
                          {planName(language, {
                            name_en: membership.plan_name_en,
                            name_th: membership.plan_name_th,
                          })}
                        </span>
                        <span className="mt-1 block text-xs text-ink-tertiary">
                          {formatDate(language, membership.start_date)}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1">
                          {membership.cancelled_at ? (
                            <Pill tone="danger">{t("admin.memberships.cancelled")}</Pill>
                          ) : membership.status ? (
                            <StatusPill status={membership.status} />
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembership ? (
                  <MembershipDetail
                    key={selectedMembership.id}
                    summary={selectedMembership}
                    memberName={selectedPerson.full_name || selectedPerson.email || "—"}
                    payments={payments.filter(
                      (payment) => payment.membership_id === selectedMembership.id,
                    )}
                    holds={holds.filter((hold) => hold.membership_id === selectedMembership.id)}
                    embedded
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <Card>
              <p className="text-sm text-ink-tertiary">{t("admin.people.selectPerson")}</p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function PersonHeader({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3">
      <Avatar url={profile.avatar_url} name={profile.full_name || profile.email || "?"} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-xl font-semibold">{profile.full_name || profile.email}</h2>
        <p className="break-words text-sm text-ink-tertiary">{profile.email}</p>
      </div>
      <Pill tone={profile.role === "admin" ? "accent" : profile.role === "coach" ? "info" : "neutral"}>
        {t(ROLE_KEY[profile.role])}
      </Pill>
    </div>
  );
}

function AccountTools({
  profile,
  pending,
  roleError,
  onRoleChange,
  onStart,
}: {
  profile: Profile;
  pending: boolean;
  roleError: boolean;
  onRoleChange: (role: UserRole) => void;
  onStart: React.TransitionStartFunction;
}) {
  const { t, language } = useLanguage();
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-secondary">{t("admin.people.account")}</h3>
          <p className="mt-0.5 text-xs text-ink-tertiary">
            {t("admin.users.joined", { date: formatDate(language, profile.created_at) })}
          </p>
        </div>
        {!profile.approved_at ? (
          <Button
            disabled={pending}
            onClick={() => onStart(() => approveUser(profile.id).then(() => {}))}
          >
            {t("admin.users.approve")}
          </Button>
        ) : null}
      </div>

      {profile.approved_at ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary">
              {t("admin.people.role")}
            </span>
            <select
              className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
              value={profile.role}
              disabled={pending}
              onChange={(event) => onRoleChange(event.target.value as UserRole)}
            >
              {(["member", "coach", "admin"] as const).map((role) => (
                <option key={role} value={role}>
                  {t(ROLE_KEY[role])}
                </option>
              ))}
            </select>
          </label>
          {profile.role !== "admin" ? (
            <Button
              variant={profile.is_active ? "danger" : "secondary"}
              disabled={pending}
              onClick={() =>
                onStart(() => setUserActive(profile.id, !profile.is_active).then(() => {}))
              }
            >
              {profile.is_active ? t("admin.users.deactivate") : t("admin.users.reactivate")}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
          {t("admin.people.approveFirst")}
        </p>
      )}
      {roleError ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink">
          {t("admin.users.lastAdmin")}
        </p>
      ) : null}
    </Card>
  );
}

function InviteTools({
  invites,
  pending,
  copied,
  onCopy,
  onStart,
}: {
  invites: Invite[];
  pending: boolean;
  copied: string | null;
  onCopy: (token: string) => void;
  onStart: React.TransitionStartFunction;
}) {
  const { t, language } = useLanguage();
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-secondary">{t("admin.invites.title")}</h2>
        <p className="mt-1 text-xs text-ink-tertiary">{t("admin.invites.explainer")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => onStart(() => createInvite("member").then(() => {}))}
        >
          {t("admin.invites.create")} — {t("admin.invites.forMember")}
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => onStart(() => createInvite("coach").then(() => {}))}
        >
          {t("admin.invites.create")} — {t("admin.invites.forCoach")}
        </Button>
      </div>
      {invites.length === 0 ? (
        <p className="text-sm text-ink-tertiary">{t("admin.invites.none")}</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {invites.map((invite) => (
            <li key={invite.token} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="flex items-center gap-2">
                <Pill tone={invite.role === "coach" ? "info" : "primary"}>
                  {t(ROLE_KEY[invite.role])}
                </Pill>
                <span className="text-xs text-ink-tertiary">
                  {t("admin.invites.expires", { date: formatDate(language, invite.expires_at) })}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => onCopy(invite.token)}>
                  {copied === invite.token ? t("admin.invites.copied") : t("admin.invites.copy")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={t("common.close")}
                  onClick={() => onStart(() => deleteInvite(invite.token))}
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NewMembershipForm({
  personId,
  plans,
  pending,
  onStart,
  onCreated,
}: {
  personId: string;
  plans: Plan[];
  pending: boolean;
  onStart: React.TransitionStartFunction;
  onCreated: (membershipId: string) => void;
}) {
  const { t, language } = useLanguage();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(bangkokToday());
  const [withPayment, setWithPayment] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === planId);

  return (
    <Card>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!planId) return;
          setError(false);
          onStart(async () => {
            const result = await createMembership({
              memberId: personId,
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
            if (result.ok && result.membershipId) onCreated(result.membershipId);
            else setError(true);
          });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary">
            {t("admin.memberships.plan")}
          </span>
          <select
            required
            className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {planName(language, plan)} — {formatTHB(language, plan.price_thb)}
              </option>
            ))}
          </select>
          {selectedPlan ? (
            <span className="mt-1 block"><PlanRule plan={selectedPlan} /></span>
          ) : null}
        </label>
        <Field
          label={t("admin.memberships.startDate")}
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink-secondary sm:col-span-2">
          <input
            type="checkbox"
            checked={withPayment}
            onChange={(event) => setWithPayment(event.target.checked)}
          />
          {t("admin.memberships.recordPaymentNow")}
        </label>
        {withPayment ? (
          <>
            <Field
              label={t("admin.membership.amount")}
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={String(selectedPlan?.price_thb ?? "")}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-secondary">
                {t("admin.membership.methodLabel")}
              </span>
              <select
                className="w-full rounded-lg border border-hairline bg-surface-raised px-3 py-2 text-sm"
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              >
                {METHODS.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {t(`method.${paymentMethod}` as LocaleKey)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        {error ? (
          <p className="text-sm text-danger-ink sm:col-span-2">{t("common.error")}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending || !planId}>
            {pending ? t("common.loading") : t("admin.memberships.create")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
