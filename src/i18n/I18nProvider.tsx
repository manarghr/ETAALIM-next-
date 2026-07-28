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

/** Values substituted into a string's {placeholders}. */
export type TVars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: TVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const VALID: Locale[] = ["en", "fr", "ar"];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Restore the saved language on first mount. This has to be an effect, not
  // lazy initial state: localStorage doesn't exist during server rendering, and
  // reading it while rendering would make the server and client disagree.
  // Reading an external store is exactly what the rule's docs allow an effect
  // to do, so the one-off render it costs is intended.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Locale | null;
    if (saved && VALID.includes(saved)) setLocaleState(saved);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    (key: string, vars?: TVars): string => {
      const lookup = (dict: unknown) =>
        key
          .split(".")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .reduce<any>((obj, k) => (obj == null ? undefined : obj[k]), dict);

      const value = lookup(translations[locale] ?? translations.en);
      // fall back to English, then to the key itself
      const raw =
        typeof value === "string" ? value : lookup(translations.en);
      const str = typeof raw === "string" ? raw : key;

      // Each language places {name}/{count} where its own grammar wants them,
      // so callers never concatenate sentence fragments.
      return vars
        ? str.replace(/\{(\w+)\}/g, (m, k) =>
            k in vars ? String(vars[k]) : m
          )
        : str;
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
