"use client";

// Catches any error thrown while rendering a page. Without this file Next.js
// shows its own bare error screen, which looks like the site fell over.
import { useEffect } from "react";
import Link from "next/link";
import styles from "./status.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Somewhere to hook a real error reporter up to later.
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <i className={`fa fa-exclamation-triangle ${styles.icon}`}></i>
        <h1>Something went wrong</h1>
        <p>
          The page couldn&apos;t be displayed. Trying again often fixes it — the
          problem is usually a lost connection.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={reset}>
            Try again
          </button>
          <Link className={styles.secondary} href="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
