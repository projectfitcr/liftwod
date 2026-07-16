"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Wordmark } from "@/components/shell/Wordmark";
import { Icon } from "@/components/shell/Icon";
import { TRAINING_PREFIXES } from "@/components/shell/nav";
import { signOut } from "@/lib/auth/actions";

export function TopBar({ role }: { role: "admin" | "coach" | "member" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isStaff = role === "admin" || role === "coach";
  const training =
    role === "member" ||
    TRAINING_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const staffHome = role === "admin" ? "/admin" : "/coach";
  const home = training ? "/today" : staffHome;

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href={home} className="shrink-0" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {isStaff ? (
            <Link
              href={training ? staffHome : "/today"}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline bg-surface-raised px-3 text-xs font-semibold text-ink-secondary hover:border-primary/50 hover:text-ink-primary"
            >
              <Icon
                name={
                  training ? (role === "admin" ? "admin" : "wod") : "profile"
                }
                className="h-4 w-4"
              />
              {training
                ? t(role === "admin" ? "workspace.admin" : "workspace.coach")
                : t("workspace.training")}
            </Link>
          ) : null}
          <LanguageToggle />

          <nav className="hidden items-center lg:flex">
            <form action={signOut}>
              <button
                type="submit"
                className="min-h-10 rounded-lg px-3 text-sm text-ink-tertiary hover:bg-row-hover hover:text-ink-primary"
              >
                {t("common.signOut")}
              </button>
            </form>
          </nav>

          {/* Phone/tablet: everything in a menu */}
          <button
            type="button"
            aria-label={t(open ? "common.close" : "common.menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-row-hover lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-hairline bg-surface px-4 py-2 lg:hidden">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
            {training
              ? t("workspace.training")
              : t(role === "admin" ? "workspace.admin" : "workspace.coach")}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 w-full rounded-lg px-2 text-left text-sm text-ink-tertiary hover:bg-row-hover hover:text-ink-primary"
            >
              {t("common.signOut")}
            </button>
          </form>
        </nav>
      ) : null}
    </header>
  );
}
