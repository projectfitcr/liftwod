import type { LocaleKey } from "@/lib/i18n";
import type { IconName } from "@/components/shell/Icon";

export type NavItem = {
  href: string;
  labelKey: LocaleKey;
  icon: IconName;
};

/** Member bottom tabs (mobile-first). */
export const MEMBER_NAV: NavItem[] = [
  { href: "/today", labelKey: "nav.today", icon: "today" },
  { href: "/schedule", labelKey: "nav.schedule", icon: "schedule" },
  { href: "/whiteboard", labelKey: "nav.whiteboard", icon: "whiteboard" },
  { href: "/results", labelKey: "nav.results", icon: "results" },
  { href: "/profile", labelKey: "nav.profile", icon: "profile" },
];

/** Extra TopBar links by role (sidebar arrives with the coach/admin builds). */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/schedule", labelKey: "nav.schedule", icon: "schedule" },
  { href: "/admin/memberships", labelKey: "nav.memberships", icon: "memberships" },
  { href: "/admin/plans", labelKey: "nav.plans", icon: "plans" },
  { href: "/admin/users", labelKey: "nav.users", icon: "users" },
];
