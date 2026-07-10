import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth/guards";
import { isLanguage, type Language } from "@/lib/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  const language: Language = isLanguage(profile.preferred_language)
    ? profile.preferred_language
    : "th";

  return (
    <LanguageProvider initialLanguage={language}>
      <AppShell role={profile.role}>{children}</AppShell>
    </LanguageProvider>
  );
}
