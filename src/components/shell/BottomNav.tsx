"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Icon } from "@/components/shell/Icon";
import {
  ADMIN_NAV,
  COACH_NAV,
  MEMBER_NAV,
  TRAINING_PREFIXES,
} from "@/components/shell/nav";

export function BottomNav({ role }: { role: "admin" | "coach" | "member" }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const training =
    role === "member" ||
    TRAINING_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const items = training
    ? MEMBER_NAV
    : role === "admin"
      ? ADMIN_NAV
      : COACH_NAV;

  return (
    <nav
      aria-label={t("nav.primary")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl">
        {items.map((item) => {
          const matches = item.match ?? [item.href];
          const active = matches.some(
            (href) =>
              pathname === href ||
              (!item.exact && pathname.startsWith(`${href}/`)),
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] ${
                active
                  ? "text-primary"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {active ? (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
              ) : null}
              <Icon name={item.icon} />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
