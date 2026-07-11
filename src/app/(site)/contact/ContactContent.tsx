"use client";

import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Faq, { FaqEntry } from "@/components/Faq";
import ContactForm from "./ContactForm";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

export default function ContactContent() {
  const { t } = useI18n();

  const infoCards = [
    {
      icon: "fa-map-marker",
      title: t("contactPage.locationTitle"),
      lines: [t("contactPage.locationLine1"), t("contactPage.locationLine2")],
    },
    {
      icon: "fa-envelope",
      title: t("contactPage.emailTitle"),
      lines: ["support@e_taalim.com", "info@e_taalim.com"],
    },
    {
      icon: "fa-phone",
      title: t("contactPage.callTitle"),
      lines: ["+213 XX XX XX XX", "+213 XX XX XX XX"],
    },
    {
      icon: "fa-clock-o",
      title: t("contactPage.hoursTitle"),
      lines: [t("contactPage.hoursWeekday"), t("contactPage.hoursWeekend")],
    },
  ];

  const faqItems: FaqEntry[] = [1, 2, 3, 4].map((n) => ({
    question: t(`contactPage.q${n}`),
    answer: t(`contactPage.a${n}`),
  }));

  return (
    <>
      <PageHero
        eyebrowKey="pageHero.contactEyebrow"
        titleKey="pageHero.contactTitle"
        accentKey="pageHero.contactAccent"
        subtitleKey="pageHero.contactSubtitle"
        crumbKey="pageHero.contactCrumb"
      />

      {/* Contact Section */}
      <section className={styles.contactSection}>
        <div className="container">
          <div className={styles.contactContainer}>
            <Reveal className={styles.contactInfoCards}>
              {infoCards.map((c) => (
                <div className={styles.infoCard} key={c.title}>
                  <div className={styles.iconContainer}>
                    <i className={`fa ${c.icon}`}></i>
                  </div>
                  <h3>{c.title}</h3>
                  {c.lines.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              ))}
            </Reveal>

            <Reveal delay={120}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className={styles.mapSection}>
        <div className="container">
          <Reveal className={styles.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d102239.58355570477!2d3.0160527071729247!3d36.7375608117553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fb26977ea659f%3A0x128fb3686e9aee73!2sAlgiers%2C%20Algeria!5e0!3m2!1sen!2sus!4v1683900294803!5m2!1sen!2sus"
              width="100%"
              height="420"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="E-Taalim location map"
            ></iframe>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <div className="container">
          <Reveal className={styles.sectionHeader}>
            <span className={styles.eyebrow}>{t("contactPage.faqEyebrow")}</span>
            <h2>
              {t("contactPage.faqTitle1")}{" "}
              <span className={styles.accent}>{t("contactPage.faqTitle2")}</span>
            </h2>
            <p>{t("contactPage.faqSubtitle")}</p>
          </Reveal>

          <div className={styles.faqContainer}>
            <Faq
              items={faqItems}
              classes={{
                item: styles.faqItem,
                itemActive: styles.faqActive,
                question: styles.faqQuestion,
                toggle: styles.toggleIcon,
                answer: styles.faqAnswer,
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
