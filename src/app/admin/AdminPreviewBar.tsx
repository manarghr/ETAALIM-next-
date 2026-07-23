"use client";

// Slim top bar shown on admin preview pages (/admin/mentors/[id],
// /admin/courses/[id]) — the pages students see, but without the site
// navbar/footer, so the admin never leaves "dashboard mode".
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./admin.module.css";

export default function AdminPreviewBar() {
  const { t } = useI18n();
  return (
    <div className={styles.previewBar}>
      <Link href="/admin" className={styles.previewBack}>
        <i className="fa fa-arrow-left"></i> {t("admin.backToDash")}
      </Link>
      <span className={styles.previewTag}>
        <i className="fa fa-eye"></i> {t("admin.previewTag")}
      </span>
    </div>
  );
}
