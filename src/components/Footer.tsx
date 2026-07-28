"use client";

import Link from "next/link";
import SmartImage from "./SmartImage";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogoChip}>
                <SmartImage src="/images/logo.png" alt="E-Taalim" width={56} height={56} />
              </span>
              <span className={styles.footerWordmark}>
                <span className={styles.footerWordmarkAccent}>E-</span>Taalim
              </span>
            </div>
            <div className={styles.footerTagline}>
              <p>{t("footer.tagline1")}</p>
              <p>
                <span className={styles.highlight}>{t("footer.tagline2a")}</span>{" "}
                {t("footer.tagline2b")}
              </p>
            </div>
            {/* Decorative only — E-Taalim has no social accounts, so these are
                spans rather than links that would go nowhere. `aria-hidden`
                keeps a screen reader from announcing five useless icons. */}
            <div className={styles.socialIcons} aria-hidden="true">
              <span>
                <i className="fa fa-facebook"></i>
              </span>
              <span>
                <i className="fa fa-twitter"></i>
              </span>
              <span>
                <i className="fa fa-instagram"></i>
              </span>
              <span>
                <i className="fa fa-linkedin"></i>
              </span>
              <span>
                <i className="fa fa-youtube-play"></i>
              </span>
            </div>
          </div>

          <div className={styles.footerNewsletter}>
            <h3>{t("footer.newsletterTitle")}</h3>
            <p>{t("footer.newsletterText")}</p>
            <div className={styles.newsletterForm}>
              <input type="email" placeholder={t("footer.emailPlaceholder")} />
              <button className={`btn btn-primary ${styles.newsletterBtn}`}>
                {t("footer.subscribe")}
              </button>
            </div>
          </div>

          <div className={styles.footerContact}>
            <h3>{t("footer.contactTitle")}</h3>
            <p>
              <i className="fa fa-envelope"></i> support@e_taalim.com
            </p>
            <p>
              <i className="fa fa-phone"></i> +213 XX XX XX XX
            </p>
            <p>
              <i className="fa fa-map-marker"></i> Algiers, Algeria
            </p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>Copyright © 2025 E-Taalim</p>
          <p>
            {t("footer.rights")} | <Link href="/terms">{t("footer.terms")}</Link> |{" "}
            <Link href="/privacy">{t("footer.privacy")}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
