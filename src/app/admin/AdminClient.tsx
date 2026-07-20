"use client";

import { useState, useEffect, FormEvent } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { tr, mentorDisplayName } from "@/data/localized";
import { mentors, getMentorById } from "@/data/mentors";
import { courses, getCoursesByMentor, formatDZD } from "@/data/courses";
import { getRoster } from "@/data/roster";
import { getReviews, averageRating, reviewCount } from "@/lib/reviews";
import { isAdminUnlocked, unlockAdmin, lockAdmin } from "@/lib/admin";
import styles from "./admin.module.css";

export default function AdminClient() {
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setUnlocked(isAdminUnlocked());
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(pw)) {
      setUnlocked(true);
      setError(false);
      setPw("");
    } else {
      setError(true);
    }
  };
  const lock = () => {
    lockAdmin();
    setUnlocked(false);
  };

  const money = (n: number) => formatDZD(n, locale);

  if (!mounted) {
    return <div className={styles.wrap} />;
  }

  // ===== Password gate =====
  if (!unlocked) {
    return (
      <div className={styles.gateWrap}>
        <form className={styles.gateCard} onSubmit={submit}>
          <div className={styles.gateIcon}>
            <i className="fa fa-lock"></i>
          </div>
          <h1>{t("admin.gateTitle")}</h1>
          <p>{t("admin.gateSub")}</p>
          <div className={`${styles.gateField} ${error ? styles.gateError : ""}`}>
            <i className="fa fa-key"></i>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              placeholder={t("admin.passwordPh")}
              autoFocus
            />
          </div>
          {error && <span className={styles.gateMsg}>{t("admin.wrong")}</span>}
          <button type="submit" className={styles.gateBtn}>
            {t("admin.unlock")}
          </button>
          <span className={styles.gateHint}>{t("admin.demoHint")}</span>
        </form>
      </div>
    );
  }

  // ===== Aggregated platform data (deterministic) =====
  const enrollments = courses.reduce((s, c) => s + getRoster(c.id).length, 0);
  const reviewsTotal = courses.reduce((s, c) => s + reviewCount(c.id), 0);
  const ratingList = courses.map((c) => averageRating(c.id)).filter((r) => r > 0);
  const avgRating = ratingList.length
    ? ratingList.reduce((a, b) => a + b, 0) / ratingList.length
    : 0;
  const revenue = courses.reduce(
    (s, c) => s + c.price * getRoster(c.id).length,
    0
  );

  const mentorRows = mentors.map((mt) => {
    const mc = getCoursesByMentor(mt.id);
    const students = mc.reduce((s, c) => s + getRoster(c.id).length, 0);
    return {
      mt,
      courses: mc.length,
      students,
      rating: (4.6 + (mt.id % 4) * 0.1).toFixed(1),
    };
  });

  const courseRows = courses.map((c) => {
    const mentor = getMentorById(c.mentorId);
    return {
      c,
      mentor: mentor ? mentorDisplayName(mentor, locale) : "",
      students: getRoster(c.id).length,
    };
  });

  const latestReviews = courses
    .slice(0, 12)
    .flatMap((c) => getReviews(c.id).slice(0, 1).map((r) => ({ r, course: c })))
    .slice(0, 6);

  const stats = [
    { icon: "fa-users", color: "#534ab7", value: mentors.length, label: t("admin.statMentors") },
    { icon: "fa-book", color: "#1d9e75", value: courses.length, label: t("admin.statCourses") },
    { icon: "fa-graduation-cap", color: "#e0894a", value: enrollments, label: t("admin.statEnrollments") },
    { icon: "fa-star", color: "#f5a623", value: reviewsTotal, label: t("admin.statReviews") },
    { icon: "fa-line-chart", color: "#534ab7", value: avgRating.toFixed(1), label: t("admin.statRating") },
    { icon: "fa-money", color: "#1d9e75", value: money(revenue), label: t("admin.statRevenue") },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.head}>
          <div>
            <span className={styles.eyebrow}>
              <i className="fa fa-shield"></i> {t("admin.gateTitle")}
            </span>
            <h1>{t("admin.title")}</h1>
            <p>{t("admin.subtitle")}</p>
          </div>
          <button className={styles.lockBtn} onClick={lock}>
            <i className="fa fa-lock"></i> {t("admin.lock")}
          </button>
        </div>

        {/* Stats */}
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

        {/* Mentors */}
        <h2 className={styles.blockTitle}>{t("admin.mentorsTitle")}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("admin.thMentor")}</th>
                <th>{t("admin.thField")}</th>
                <th>{t("admin.thCourses")}</th>
                <th>{t("admin.thStudents")}</th>
                <th>{t("admin.thRating")}</th>
              </tr>
            </thead>
            <tbody>
              {mentorRows.map(({ mt, courses: cc, students, rating }) => (
                <tr key={mt.id}>
                  <td>
                    <div className={styles.mentorCell}>
                      <img src={mt.profilePicture} alt={mt.name} />
                      <span>{mentorDisplayName(mt, locale)}</span>
                    </div>
                  </td>
                  <td>{tr(mt.major, locale)}</td>
                  <td>{cc}</td>
                  <td>{students}</td>
                  <td>
                    <span className={styles.rating}>
                      <i className="fa fa-star"></i> {rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Courses */}
        <h2 className={styles.blockTitle}>{t("admin.coursesTitle")}</h2>
        <div className={`${styles.tableWrap} ${styles.scrollTable}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("admin.thCourse")}</th>
                <th>{t("admin.thMentor")}</th>
                <th>{t("admin.thLevel")}</th>
                <th>{t("admin.thPrice")}</th>
                <th>{t("admin.thStudents")}</th>
                <th>{t("admin.thStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {courseRows.map(({ c, mentor, students }) => (
                <tr key={c.id}>
                  <td>{tr(c.subject, locale)}</td>
                  <td>{mentor}</td>
                  <td>{tr(c.level, locale)}</td>
                  <td className={styles.price}>{money(c.price)}</td>
                  <td>{students}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        c.status === "available" ? styles.bAvail : styles.bUpcoming
                      }`}
                    >
                      {c.status === "available"
                        ? t("admin.statusAvailable")
                        : t("admin.statusUpcoming")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Latest reviews */}
        <h2 className={styles.blockTitle}>{t("admin.reviewsTitle")}</h2>
        <div className={styles.reviewList}>
          {latestReviews.map(({ r, course }) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewAvatar}>
                {r.author.trim().charAt(0).toUpperCase()}
              </div>
              <div className={styles.reviewBody}>
                <div className={styles.reviewTop}>
                  <b>{r.author}</b>
                  <span className={styles.rating}>
                    <i className="fa fa-star"></i> {r.rating}
                  </span>
                </div>
                <p className={styles.reviewText}>
                  {r.textKey ? t(r.textKey) : r.text}
                </p>
                <span className={styles.reviewCourse}>
                  {t("admin.reviewOn", { course: tr(course.subject, locale) })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
