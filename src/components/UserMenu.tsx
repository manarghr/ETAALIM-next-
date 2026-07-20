"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { Session } from "@/lib/auth";
import styles from "./UserMenu.module.css";

/** "Yasmine Cherif" → "YC" (falls back to the email's first letter). */
function initialsOf(session: Session): string {
  const fromName = session.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (fromName || session.email[0] || "?").toUpperCase();
}

export default function UserMenu({
  session,
  onLogout,
  onNavigate,
}: {
  session: Session;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const firstName = session.name.trim().split(/\s+/)[0] || session.email;

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.myAccount")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initialsOf(session)}
        </span>
        <span className={styles.greeting}>
          {t("nav.hi")}, <strong>{firstName}</strong>
        </span>
        <i
          className={`fa fa-chevron-down ${styles.caret} ${open ? styles.caretOpen : ""}`}
          aria-hidden="true"
        ></i>
      </button>

      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`} role="menu">
        <div className={styles.identity}>
          <span className={styles.avatarLg} aria-hidden="true">
            {initialsOf(session)}
          </span>
          <div className={styles.identityText}>
            <span className={styles.name}>{session.name}</span>
            <span className={styles.email}>{session.email}</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        <Link
          href={session.role === "mentor" ? "/mentor-dashboard" : "/dashboard"}
          className={styles.item}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onNavigate();
          }}
        >
          <i className="fa fa-th-large" aria-hidden="true"></i>
          {t("nav.dashboard")}
        </Link>

        <div className={styles.divider}></div>

        <button
          type="button"
          className={`${styles.item} ${styles.danger}`}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
        >
          <i className="fa fa-sign-out" aria-hidden="true"></i>
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );
}
