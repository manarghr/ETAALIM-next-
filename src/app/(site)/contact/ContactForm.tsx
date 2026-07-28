"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export default function ContactForm() {
  const { t } = useI18n();
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const groupClass = (field: string) =>
    `${styles.formGroup} ${errors[field] ? styles.error : ""}`;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nextErrors: Record<string, boolean> = {};

    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const consent = data.get("consent") === "on";

    if (!fullName) nextErrors.fullName = true;
    if (!email || !EMAIL_RE.test(email.toLowerCase())) nextErrors.email = true;
    if (!subject) nextErrors.subject = true;
    if (!message) nextErrors.message = true;
    if (!consent) nextErrors.consent = true;

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      form.reset();
    }, 1500);
  };

  return (
    <div className={styles.contactFormContainer}>
      <div className={styles.formHeader}>
        <h3>{t("contactPage.formTitle")}</h3>
        <p>{t("contactPage.formSubtitle")}</p>
      </div>

      <form className={styles.animatedForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <div className={groupClass("fullName")}>
            <label htmlFor="fullName">
              {t("contactPage.fullName")} <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputContainer}>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder={t("contactPage.yourName")}
              />
              <i className="fa fa-user"></i>
            </div>
            <div className={styles.errorMessage}>{t("contactPage.errName")}</div>
          </div>

          <div className={groupClass("email")}>
            <label htmlFor="email">
              {t("contactPage.email")} <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputContainer}>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t("contactPage.yourEmail")}
              />
              <i className="fa fa-envelope"></i>
            </div>
            <div className={styles.errorMessage}>{t("contactPage.errEmail")}</div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="phone">{t("contactPage.phone")}</label>
            <div className={styles.inputContainer}>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder={t("contactPage.yourPhone")}
              />
              <i className="fa fa-phone"></i>
            </div>
          </div>

          <div className={groupClass("subject")}>
            <label htmlFor="subject">
              {t("contactPage.subject")} <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputContainer}>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder={t("contactPage.subjectPlaceholder")}
              />
              <i className="fa fa-tag"></i>
            </div>
            <div className={styles.errorMessage}>{t("contactPage.errSubject")}</div>
          </div>
        </div>

        <div className={groupClass("message")}>
          <label htmlFor="message">
            {t("contactPage.message")} <span className={styles.required}>*</span>
          </label>
          <div className={`${styles.inputContainer} ${styles.textareaContainer}`}>
            <textarea
              id="message"
              name="message"
              placeholder={t("contactPage.messagePlaceholder")}
              rows={5}
            ></textarea>
            <i className="fa fa-comment"></i>
          </div>
          <div className={styles.errorMessage}>{t("contactPage.errMessage")}</div>
        </div>

        <div className={`${groupClass("consent")} ${styles.checkboxGroup}`}>
          <label className={styles.checkboxContainer}>
            <input type="checkbox" id="consent" name="consent" />
            <span className={styles.checkmark}></span>
            {t("contactPage.consentPre")}{" "}
            <Link href="/privacy" className={styles.termsLink} target="_blank">
              {t("contactPage.privacyPolicy")}
            </Link>{" "}
            {t("contactPage.consentPost")}
          </label>
          <div className={styles.errorMessage}>{t("contactPage.errConsent")}</div>
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${styles.submitBtn} ${
            loading ? styles.loading : ""
          }`}
        >
          <span>{t("contactPage.sendMessage")}</span>
          <i className="fa fa-paper-plane"></i>
          <div className={styles.loader}></div>
        </button>
      </form>

      <div
        className={`${styles.successMessage} ${showSuccess ? styles.show : ""}`}
      >
        <div className={styles.successIcon}>
          <i className="fa fa-check-circle"></i>
        </div>
        <h3>{t("contactPage.successTitle")}</h3>
        <p>{t("contactPage.successText")}</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowSuccess(false)}
        >
          {t("contactPage.sendAnother")}
        </button>
      </div>
    </div>
  );
}
