"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";
import { useI18n } from "@/i18n/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";
import { getSession, logout, AUTH_EVENT, Session } from "@/lib/auth";

// Dashboard isn't a nav link — signed-in users reach it from the profile menu.
const links = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/courses", key: "nav.courses" },
  { href: "/mentors", key: "nav.mentors" },
  { href: "/contact", key: "nav.contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // keep the header in sync with the mock session (login / logout / other tabs)
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut(); // end the REAL Supabase session
    logout();                      // clear the old fake session too
    setOpen(false);
    router.push("/");
  };

  // close the drawer on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <i className="fa fa-bars"></i>
        </button>

        <Link href="/" className={styles.logo} onClick={close}>
          <img src="/images/logo.png" alt="E-Taalim" />
          <span className={styles.wordmark}>
            <span className={styles.wordmarkAccent}>E-</span>Taalim
          </span>
        </Link>

        <div className={`${styles.menu} ${open ? styles.menuOpen : ""}`}>
          <div className={styles.drawerHead}>
            <span className={styles.wordmark}>
              <span className={styles.wordmarkAccent}>E-</span>Taalim
            </span>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close menu"
              onClick={close}
            >
              <i className="fa fa-times"></i>
            </button>
          </div>

          <nav className={styles.nav}>
            <ul className={styles.navLinks}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={isActive(l.href) ? styles.active : ""}
                    onClick={close}
                  >
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.signIn}>
            <LanguageSwitcher />
            {session ? (
              <UserMenu session={session} onLogout={onLogout} onNavigate={close} />
            ) : (
              <>
                <Link href="/login" className={styles.loginBtn} onClick={close}>
                  {t("nav.login")}
                </Link>
                <Link href="/signup" className={styles.signBtn} onClick={close}>
                  {t("nav.signin")}
                </Link>
              </>
            )}
          </div>
        </div>

        <div
          className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
          onClick={close}
          aria-hidden="true"
        ></div>
      </div>
    </header>
  );
}
