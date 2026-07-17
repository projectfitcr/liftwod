import { redirect } from "next/navigation";

export default async function AdminMembershipsPage() {
  redirect("/admin/people");
}
