"use client";

import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const valueIcons = [
  "fa-eye",
  "fa-check-circle",
  "fa-rocket",
  "fa-lightbulb-o",
  "fa-users",
  "fa-refresh",
];

export default function AboutContent() {
  const { t } = useI18n();

  const values = valueIcons.map((icon, i) => ({
    icon,
    title: t(`aboutPage.v${i + 1}t`),
    text: t(`aboutPage.v${i + 1}d`),
  }));

  return (
    <div className={styles.page}>
      <PageHero
        eyebrowKey="pageHero.aboutEyebrow"
        titleKey="pageHero.aboutTitle"
        accentKey="pageHero.aboutAccent"
        subtitleKey="pageHero.aboutSubtitle"
        crumbKey="pageHero.aboutCrumb"
      />

      {/* Intro */}
      <section className={styles.intro}>
        <div className="container">
          <Reveal className={styles.introInner}>
            <span className={styles.eyebrow}>{t("aboutPage.introEyebrow")}</span>
            <h2>
              {t("aboutPage.introTitle1")}{" "}
              <span className={styles.accent}>{t("aboutPage.introTitle2")}</span>
            </h2>
            <p>{t("aboutPage.introText")}</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className={styles.values}>
        <div className="container">
          <div className={styles.valuesGrid}>
            {values.map((v, i) => (
              <Reveal key={v.title} className={styles.valueCard} delay={i * 80}>
                <div className={styles.valueIcon}>
                  <i className={`fa ${v.icon}`}></i>
                </div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className={styles.quoteBand}>
        <div className="container">
          <Reveal className={styles.quoteInner}>
            <p>{t("aboutPage.quote")}</p>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className="container">
          <Reveal className={styles.finalInner}>
            <h2>{t("aboutPage.ctaTitle")}</h2>
            <p>{t("aboutPage.ctaText")}</p>
            <div className={styles.finalActions}>
              <Link href="/courses" className="btn btn-primary">
                {t("aboutPage.ctaExplore")} <i className="fa fa-arrow-right"></i>
              </Link>
              <Link href="/mentor-form" className="btn btn-secondary">
                {t("aboutPage.ctaMentor")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
