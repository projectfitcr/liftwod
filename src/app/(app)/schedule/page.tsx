import { requireUser } from "@/lib/auth/guards";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default async function SchedulePage() {
  await requireUser();
  return <ComingSoon titleKey="nav.schedule" />;
}
