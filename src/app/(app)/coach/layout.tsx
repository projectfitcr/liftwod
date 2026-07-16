import { requireStaff } from "@/lib/auth/guards";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return children;
}
