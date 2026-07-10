"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Card } from "@/components/ui/Card";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import {
  MembershipStatusCard,
  type MembershipSummary,
} from "@/components/membership/MembershipStatusCard";

export function ProfileView({
  userId,
  fullName,
  email,
  avatarUrl,
  summary,
}: {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  summary: MembershipSummary | null;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("profile.title")}</h1>

      <Card className="space-y-3">
        <AvatarUpload userId={userId} avatarUrl={avatarUrl} name={fullName || email} />
        <div>
          <p className="text-xs text-ink-tertiary">{t("profile.name")}</p>
          <p className="text-sm">{fullName || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-tertiary">{t("profile.email")}</p>
          <p className="text-sm">{email || "—"}</p>
        </div>
        <div className="flex items-center justify-between border-t border-hairline pt-3">
          <p className="text-sm text-ink-secondary">{t("common.language")}</p>
          <LanguageToggle />
        </div>
        <div className="border-t border-hairline pt-3">
          <Link
            href="/update-password"
            className="text-sm text-primary-ink hover:underline"
          >
            {t("profile.changePassword")}
          </Link>
        </div>
      </Card>

      <MembershipStatusCard summary={summary} />
    </div>
  );
}
