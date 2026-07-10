"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Wordmark } from "@/components/shell/Wordmark";
import { Icon } from "@/components/shell/Icon";
import { ADMIN_NAV, STAFF_NAV } from "@/components/shell/nav";
import { signOut } from "@/lib/auth/actions";

export function TopBar({ role }: { role: "admin" | "coach" | "member" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const links = [
    ...(role === "admin" || role === "coach" ? STAFF_NAV : []),
    ...(role === "admin" ? ADMIN_NAV : []),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/today" className="shrink-0" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <LanguageToggle />

          {/* Desktop: inline links + sign out */}
          <nav className="hidden items-center gap-1.5 lg:flex">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-secondary hover:bg-row-hover hover:text-ink-primary"
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-sm text-ink-tertiary hover:bg-row-hover hover:text-ink-primary"
              >
                {t("common.signOut")}
              </button>
            </form>
          </nav>

          {/* Phone/tablet: everything in a menu */}
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-ink-secondary hover:bg-row-hover lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-hairline bg-surface px-4 py-2 lg:hidden">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-ink-secondary hover:bg-row-hover hover:text-ink-primary"
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-2 py-2.5 text-left text-sm text-ink-tertiary hover:bg-row-hover hover:text-ink-primary"
            >
              {t("common.signOut")}
            </button>
          </form>
        </nav>
      ) : null}
    </header>
  );
}
