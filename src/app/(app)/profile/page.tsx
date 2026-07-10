import { requireUser } from "@/lib/auth/guards";
import { ProfileView } from "./ProfileView";

export default async function ProfilePage() {
  const profile = await requireUser();
  return (
    <ProfileView
      fullName={profile.full_name}
      email={profile.email ?? ""}
    />
  );
}
