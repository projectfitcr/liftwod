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

/** TopBar links for coach AND admin. */
export const STAFF_NAV: NavItem[] = [
  { href: "/coach/wods", labelKey: "nav.wods", icon: "wod" },
  { href: "/coach/members", labelKey: "nav.members", icon: "users" },
];

/** Extra TopBar links, admin only. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/schedule", labelKey: "nav.schedule", icon: "schedule" },
  { href: "/admin/memberships", labelKey: "nav.memberships", icon: "memberships" },
  { href: "/admin/plans", labelKey: "nav.plans", icon: "plans" },
  { href: "/admin/users", labelKey: "nav.users", icon: "users" },
];
