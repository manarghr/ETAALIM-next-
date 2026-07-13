"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./Header.module.css";

const links = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/courses", key: "nav.courses" },
  { href: "/mentors", key: "nav.mentors" },
  { href: "/contact", key: "nav.contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <img src="/images/logo.png" alt="E-Taalim" />
          <span className={styles.wordmark}>
            <span className={styles.wordmarkAccent}>E-</span>Taalim
          </span>
        </Link>
        <nav className={styles.nav}>
          <ul className={styles.navLinks}>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={isActive(l.href) ? styles.active : ""}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.signIn}>
          <LanguageSwitcher />
          <Link href="/login" className={styles.loginBtn}>
            {t("nav.login")}
          </Link>
          <Link href="/signup" className={styles.signBtn}>
            {t("nav.signin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
