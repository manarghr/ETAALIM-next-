// Shown for any URL that doesn't exist (and wherever notFound() is called).
import Link from "next/link";
import styles from "./status.module.css";

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1>Page not found</h1>
        <p>
          This page doesn&apos;t exist, or it has moved. The course you&apos;re
          after may have been renamed.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/">
            Back to home
          </Link>
          <Link className={styles.secondary} href="/courses">
            Browse courses
          </Link>
        </div>
      </div>
    </div>
  );
}
