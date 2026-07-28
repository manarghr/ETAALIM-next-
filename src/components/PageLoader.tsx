// A centred spinner for the moment between "page mounted" and "we know what to
// show" — checking a session, resolving a course. It replaces the blank white
// screens that `return null` used to leave behind.
import styles from "./PageLoader.module.css";

export default function PageLoader({ label }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label ?? "Loading…"}</span>
    </div>
  );
}
