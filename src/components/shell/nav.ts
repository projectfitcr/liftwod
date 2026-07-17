import type { LocaleKey } from "@/lib/i18n";
import type { IconName } from "@/components/shell/Icon";

export type NavItem = {
  href: string;
  labelKey: LocaleKey;
  icon: IconName;
  match?: string[];
  exact?: boolean;
};

/** Member bottom tabs (mobile-first). */
export const MEMBER_NAV: NavItem[] = [
  { href: "/today", labelKey: "nav.home", icon: "today" },
  { href: "/schedule", labelKey: "nav.schedule", icon: "schedule" },
  { href: "/whiteboard", labelKey: "nav.leaderboard", icon: "whiteboard" },
  { href: "/results", labelKey: "nav.progress", icon: "results" },
  { href: "/profile", labelKey: "nav.profile", icon: "profile" },
];

export const COACH_NAV: NavItem[] = [
  { href: "/coach", labelKey: "nav.today", icon: "today", exact: true },
  {
    href: "/coach/classes",
    labelKey: "nav.classes",
    icon: "schedule",
    match: ["/coach/classes", "/coach/class"],
  },
  { href: "/coach/wods", labelKey: "nav.programming", icon: "wod" },
  { href: "/coach/members", labelKey: "nav.members", icon: "users" },
  {
    href: "/coach/more",
    labelKey: "nav.more",
    icon: "menu",
    match: ["/coach/more", "/coach/exercises"],
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    labelKey: "nav.dashboard",
    icon: "today",
    exact: true,
  },
  {
    href: "/admin/people",
    labelKey: "nav.people",
    icon: "users",
    match: ["/admin/people", "/coach/members", "/admin/users", "/admin/memberships"],
  },
  {
    href: "/admin/schedule",
    labelKey: "nav.schedule",
    icon: "schedule",
    match: ["/admin/schedule", "/coach/class"],
  },
  { href: "/coach/wods", labelKey: "nav.programming", icon: "wod" },
  {
    href: "/admin/more",
    labelKey: "nav.more",
    icon: "menu",
    match: ["/admin/more", "/admin/plans", "/coach/exercises"],
  },
];

export const TRAINING_PREFIXES = [
  "/today",
  "/schedule",
  "/whiteboard",
  "/results",
  "/profile",
  "/wod",
];
