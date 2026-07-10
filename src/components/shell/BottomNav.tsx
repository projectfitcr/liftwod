"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Icon } from "@/components/shell/Icon";
import { MEMBER_NAV } from "@/components/shell/nav";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-5xl">
        {MEMBER_NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "text-primary" : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              <Icon name={item.icon} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
