"use client";

// Terms and Privacy share one layout — same shape, different text — so they
// live in one component keyed by `kind`. Both are translated like the rest of
// the site, and both say plainly that this is a portfolio project rather than
// pretending to be a live commercial service.
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./legal.module.css";

const SECTIONS = [1, 2, 3, 4, 5];

export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <div className="container">
        <article className={styles.card}>
          <h1>{t(`legal.${kind}Title`)}</h1>
          <p className={styles.updated}>{t("legal.updated")}</p>

          <div className={styles.notice}>
            <i className="fa fa-info-circle"></i>
            <span>{t("legal.demoNotice")}</span>
          </div>

          <p className={styles.intro}>{t(`legal.${kind}Intro`)}</p>

          {SECTIONS.map((n) => (
            <section key={n}>
              <h2>{t(`legal.${kind}${n}t`)}</h2>
              <p>{t(`legal.${kind}${n}b`)}</p>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
