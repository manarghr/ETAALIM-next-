"use client";

// Simple dashboard-style student profile for the admin — profile head,
// quick stats, enrolled courses and wallet transactions.
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { tr, mentorDisplayName } from "@/data/localized";
import { getMentorById } from "@/data/mentors";
import { getCourseById, formatDZD, formatDate } from "@/data/courses";
import { educationLabel } from "@/data/education";
import { StudentRecord } from "@/data/students";
import styles from "../../admin.module.css";

export default function StudentProfileClient({
  student,
}: {
  student: StudentRecord;
}) {
  const { t, locale } = useI18n();
  const money = (n: number) => formatDZD(n, locale);
  const grade = educationLabel(
    { cycle: student.cycle, year: student.year, extra: student.extra },
    locale
  );

  const stats = [
    { icon: "fa-money", color: "#1d9e75", value: money(student.balance), label: t("admin.dBalance") },
    { icon: "fa-book", color: "#534ab7", value: student.enrolledCourseIds.length, label: t("admin.dEnrolled") },
    { icon: "fa-calendar", color: "#e0894a", value: formatDate(student.joined.slice(0, 10), locale), label: t("admin.dJoined") },
  ];

  return (
    <div className={styles.profilePage}>
      {/* Profile head */}
      <div className={styles.profileCard}>
        <span className={styles.pAvatar}>{student.initials}</span>
        <div className={styles.pInfo}>
          <b>{student.name}</b>
          <span className={styles.detailGrade}>{grade}</span>
        </div>
        <div className={styles.pContact}>
          <span className={styles.contactRow}>
            <i className="fa fa-envelope"></i> {student.email}
          </span>
          <span className={styles.contactRow}>
            <i className="fa fa-phone"></i> {student.phone}
          </span>
          {/* parent/guardian contact — captured at signup for minors */}
          {student.parentEmail && (
            <a href={`mailto:${student.parentEmail}`} className={styles.contactRow}>
              <i className="fa fa-shield"></i> {t("admin.dParent")} · {student.parentEmail}
            </a>
          )}
          {student.parentPhone && (
            <span className={styles.contactRow}>
              <i className="fa fa-mobile"></i> {t("admin.dParent")} · {student.parentPhone}
            </span>
          )}
          <a href={`mailto:${student.email}`} className={styles.emailBtn}>
            <i className="fa fa-paper-plane"></i> {t("admin.dSendEmail")}
          </a>
        </div>
      </div>

      {/* Quick stats */}
      <div className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: s.color }}>
              <i className={`fa ${s.icon}`}></i>
            </span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.pCols}>
        {/* Enrolled courses */}
        <div className={styles.pCard}>
          <h4 className={styles.detailSection}>
            {t("admin.dEnrolled")} ({student.enrolledCourseIds.length})
          </h4>
          {student.enrolledCourseIds.length === 0 ? (
            <p className={styles.muted}>{t("admin.dNoEnrolled")}</p>
          ) : (
            <div className={styles.detailList}>
              {student.enrolledCourseIds.map((cid) => {
                const c = getCourseById(cid);
                if (!c) return null;
                const mentor = getMentorById(c.mentorId);
                return (
                  <Link
                    key={cid}
                    href={`/admin/courses/${cid}`}
                    className={styles.detailCourse}
                  >
                    <div>
                      <b>{tr(c.subject, locale)}</b>
                      <span>{mentor ? mentorDisplayName(mentor, locale) : ""}</span>
                    </div>
                    <span className={styles.price}>{money(c.price)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className={styles.pCard}>
          <h4 className={styles.detailSection}>{t("admin.dTransactions")}</h4>
          {student.transactions.length === 0 ? (
            <p className={styles.muted}>{t("admin.dNoTx")}</p>
          ) : (
            <div className={styles.detailList}>
              {student.transactions.map((tx) => (
                <div key={tx.id} className={styles.txRow}>
                  <span
                    className={styles.txIcon}
                    style={{ color: tx.type === "topup" ? "#1d9e75" : "#534ab7" }}
                  >
                    <i className={`fa ${tx.type === "topup" ? "fa-plus" : "fa-graduation-cap"}`}></i>
                  </span>
                  <span className={styles.txLabel}>
                    {tx.type === "topup"
                      ? t("admin.dTopup")
                      : t("admin.dPurchase", { subject: tr(tx.subject ?? "", locale) })}
                  </span>
                  <span className={tx.type === "topup" ? styles.txPos : styles.txNeg}>
                    {tx.type === "topup" ? "+" : "−"}
                    {money(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
