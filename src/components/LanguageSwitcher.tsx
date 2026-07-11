"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Locale } from "@/i18n/translations";
import styles from "./LanguageSwitcher.module.css";

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇩🇿" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change language"
      >
        <i className={`fa fa-globe ${styles.globe}`}></i>
        <span>{locale.toUpperCase()}</span>
        <i className={`fa fa-angle-down ${styles.chev} ${open ? styles.chevOpen : ""}`}></i>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {languages.map((l) => (
            <button
              key={l.code}
              className={`${styles.item} ${locale === l.code ? styles.itemActive : ""}`}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              role="menuitem"
            >
              <span className={styles.flag}>{l.flag}</span>
              {l.label}
              {locale === l.code && <i className={`fa fa-check ${styles.check}`}></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
