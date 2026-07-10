import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Wordmark } from "@/components/shell/Wordmark";
import { getProfile } from "@/lib/auth/guards";
import { isLanguage, type Language } from "@/lib/i18n";

/** Public/auth pages: centered card, Thai-first with a local toggle; a
 *  signed-in visitor (e.g. /pending) gets their stored preference. */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  const initial: Language = isLanguage(profile?.preferred_language)
    ? profile.preferred_language
    : "th";

  return (
    <LanguageProvider initialLanguage={initial}>
      <div className="flex min-h-dvh flex-col items-center px-4">
        <div className="flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex items-center justify-between">
            <Wordmark className="text-2xl" />
            <LanguageToggle />
          </div>
          {children}
        </div>
      </div>
    </LanguageProvider>
  );
}
