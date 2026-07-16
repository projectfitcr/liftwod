import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";

export function AppShell({
  role,
  children,
}: {
  role: "admin" | "coach" | "member";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar role={role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  );
}
