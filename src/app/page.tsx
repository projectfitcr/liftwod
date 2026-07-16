import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";

export default async function RootPage() {
  const profile = await requireUser();
  redirect(
    profile.role === "admin"
      ? "/admin"
      : profile.role === "coach"
        ? "/coach"
        : "/today",
  );
}
