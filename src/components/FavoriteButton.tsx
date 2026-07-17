"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { isFavorite, toggleFavorite } from "@/lib/student";
import { AUTH_EVENT } from "@/lib/auth";
import styles from "./FavoriteButton.module.css";

/**
 * Star toggle for saving a course. `variant` controls the look:
 * "icon" = bare star (for card corners), "full" = star + label (sidebar).
 */
export default function FavoriteButton({
  courseId,
  variant = "icon",
  onChange,
}: {
  courseId: number;
  variant?: "icon" | "full";
  onChange?: (fav: boolean) => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    // Client-only read, deferred past hydration (see note above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setFav(isFavorite(courseId));
    // keep in sync if toggled elsewhere (other cards, other tabs)
    const sync = () => setFav(isFavorite(courseId));
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [courseId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(courseId);
    const now = isFavorite(courseId);
    setFav(now);
    onChange?.(now);
    // let other FavoriteButtons on the page update too
    window.dispatchEvent(new Event(AUTH_EVENT));
  };

  const active = mounted && fav;
  const label = active ? t("dash.favRemove") : t("dash.favAdd");

  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[variant]} ${active ? styles.active : ""}`}
      onClick={toggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <i className={`fa ${active ? "fa-star" : "fa-star-o"}`}></i>
      {variant === "full" && <span>{label}</span>}
    </button>
  );
}
