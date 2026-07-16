"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { translate, type Language, type LocaleKey } from "@/lib/i18n";
import { updatePreferredLanguage } from "@/lib/users/actions";

type LanguageContextValue = {
  language: Language;
  t: (key: LocaleKey, params?: Record<string, string | number>) => string;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Client context seeded server-side with profiles.preferred_language. The
 * toggle flips local state instantly (every user-visible string is
 * client-rendered through t()) while the server action persists in the
 * background. Plain useState, NOT useOptimistic — the action doesn't
 * revalidate the layout, so optimistic state would snap back (oxcart lesson).
 */
export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void updatePreferredLanguage(next);
  }, []);

  const t = useCallback(
    (key: LocaleKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
