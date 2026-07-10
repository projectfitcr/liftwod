"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Wordmark } from "@/components/shell/Wordmark";
import { Icon } from "@/components/shell/Icon";
import { ADMIN_NAV } from "@/components/shell/nav";
import { signOut } from "@/lib/auth/actions";

export function TopBar({ role }: { role: "admin" | "coach" | "member" }) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/today" className="shrink-0">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          {role === "admin"
            ? ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-secondary hover:bg-row-hover hover:text-ink-primary"
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(item.labelKey)}</span>
                </Link>
              ))
            : null}
          <LanguageToggle />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1.5 text-sm text-ink-tertiary hover:bg-row-hover hover:text-ink-primary"
            >
              {t("common.signOut")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
