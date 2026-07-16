"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";

const links = [
  ["/admin/users", "admin.more.users"],
  ["/admin/memberships", "admin.more.memberships"],
  ["/admin/plans", "admin.more.plans"],
  ["/profile", "admin.more.profile"],
] as const;

export default function AdminMorePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.more.title")}</h1>
      <Card className="p-0">
        <ul className="divide-y divide-hairline">
          {links.map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-14 items-center justify-between px-4 text-sm font-medium hover:bg-row-hover"
              >
                {t(label)} <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
