"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { translations, Locale } from "./translations";

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const VALID: Locale[] = ["en", "fr", "ar"];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Restore saved language on first mount.
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Locale | null;
    if (saved && VALID.includes(saved)) setLocaleState(saved);
  }, []);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  // Reflect the current language/direction on <html>.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale] ?? translations.en;
      const value = key
        .split(".")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce<any>((obj, k) => (obj == null ? undefined : obj[k]), dict);
      if (typeof value === "string") return value;
      // fall back to English, then to the key itself
      const fallback = key
        .split(".")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce<any>((obj, k) => (obj == null ? undefined : obj[k]), translations.en);
      return typeof fallback === "string" ? fallback : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
