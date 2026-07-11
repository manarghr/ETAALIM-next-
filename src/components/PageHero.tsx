"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./PageHero.module.css";

interface PageHeroProps {
  eyebrowKey?: string;
  titleKey: string;
  accentKey?: string;
  subtitleKey?: string;
  crumbKey?: string;
}

// Shared gradient page banner. Takes translation keys so every page's header
// switches language with the rest of the site.
export default function PageHero({
  eyebrowKey,
  titleKey,
  accentKey,
  subtitleKey,
  crumbKey,
}: PageHeroProps) {
  const { t } = useI18n();
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.inner}>
          {eyebrowKey && <span className={styles.eyebrow}>{t(eyebrowKey)}</span>}
          <h1 className={styles.title}>
            {t(titleKey)}
            {accentKey && (
              <>
                {" "}
                <span className={styles.accent}>{t(accentKey)}</span>
              </>
            )}
          </h1>
          {subtitleKey && <p className={styles.subtitle}>{t(subtitleKey)}</p>}
          {crumbKey && (
            <nav className={styles.crumb}>
              <Link href="/">{t("nav.home")}</Link>
              <span className={styles.sep}>/</span>
              <span className={styles.current}>{t(crumbKey)}</span>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
