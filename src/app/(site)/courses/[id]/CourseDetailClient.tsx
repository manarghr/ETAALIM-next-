"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Course,
  getRelatedCourses,
  getJoinOptions,
  formatDate,
  formatTime,
  formatDZD,
} from "@/data/courses";
import { getLessons } from "@/data/lessons";
import { getMentorById, getOtherMentorsInMajor } from "@/data/mentors";
import { tr, mentorDisplayName } from "@/data/localized";
import { isEnrolled } from "@/lib/enrollment";
import { categoryAccent } from "@/lib/theme";
import { effectiveCourse, EffectiveCourse } from "@/lib/catalog";
import { useI18n } from "@/i18n/I18nProvider";
import CourseLearn from "@/components/CourseLearn";
import CourseReviews from "@/components/CourseReviews";
import FavoriteButton from "@/components/FavoriteButton";
import styles from "./page.module.css";

export default function CourseDetailClient({ course: baseCourse }: { course: Course }) {
  const { t, locale } = useI18n();

  // SSR shows the static course; on mount apply the admin's overrides
  // (edited price/description/status…), stored client-side.
  const [course, setCourse] = useState<Course | EffectiveCourse>(baseCourse);
  useEffect(() => {
    effectiveCourse(baseCourse.id).then((eff) => {
    
      if (eff) setCourse(eff);
    });
  }, [baseCourse.id]);
  const description = "description" in course ? course.description : undefined;

  // Reflect a prior purchase (stored client-side) — the course shows as unlocked.
  const [enrolled, setEnrolled] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnrolled(isEnrolled(course.id));
  }, [course.id]);

  const mentor = getMentorById(course.mentorId);
  const lessons = getLessons(course.id, course.major);
  const relatedCourses = getRelatedCourses(course.mentorId, course.id);
  const otherMentors = getOtherMentorsInMajor(course.major, course.mentorId);
  // Deterministic (avoids SSR/client hydration mismatch), pseudo-random 50..2000.
  const studentCount = 50 + ((course.id * 137) % 1951);
  const mentorImage = mentor?.profilePicture || "/images/mentor1.png";
  const joinOptions = getJoinOptions(course);

  const subject = tr(course.subject, locale);
  const major = tr(course.major, locale);
  const level = tr(course.level, locale);

  const aboutBody = t("courseDetail.aboutBody")
    .replace("{subject}", subject)
    .replace("{level}", level)
    .replace("{major}", major);

  return (
    <>
      {/* Course header */}
      <section className={styles.courseHeader}>
        <div className="container">
          <div className={styles.headerInner}>
            <nav className={styles.crumb}>
              <Link href="/">{t("courseDetail.home")}</Link>
              <span className={styles.sep}>/</span>
              <Link href="/courses">{t("courseDetail.courses")}</Link>
              <span className={styles.sep}>/</span>
              <span>{subject}</span>
            </nav>
            <h1>{subject}</h1>
            <div className={styles.categories}>
              <span
                className={styles.categoryTag}
                style={{
                  background: categoryAccent(course.major).color,
                  borderColor: "transparent",
                }}
              >
                {major}
              </span>
              
              <span className={styles.categoryTag}>
                <i className="fa fa-graduation-cap"></i> {tr(course.tier, locale)}
              </span>
              <span className={styles.categoryTag}>
                <i className="fa fa-calendar"></i> {formatDate(course.date, locale)}
              </span>
              <span className={styles.categoryTag}>
                <i className="fa fa-clock-o"></i> {formatTime(course.time, locale)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.wrap}>
        <div className="container">
          <div className={styles.layout}>
            <main className={styles.main}>
              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("courseDetail.aboutTitle")}</h2>
                {/* the admin-written description wins over the generated text */}
                <p className={styles.description}>{description || aboutBody}</p>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("courseDetail.joinTitle")}</h2>
                <p className={styles.description} style={{ marginTop: 0, marginBottom: 20 }}>
                  {t("courseDetail.joinIntro")}
                </p>
                <div className={styles.joinGrid}>
                  {joinOptions.map((opt) => (
                    <div className={styles.joinCard} key={opt.mode}>
                      <div className={styles.joinIcon}>
                        <i className={`fa ${opt.icon}`}></i>
                      </div>
                      <div className={styles.joinInfo}>
                        <div className={styles.joinTitle}>
                          {tr(opt.title, locale)}
                          {opt.mode === "group" && (
                            <span className={styles.popularTag}>{t("courseDetail.popular")}</span>
                          )}
                        </div>
                        <div className={styles.joinDesc}>{tr(opt.desc, locale)}</div>
                      </div>
                      <div className={styles.joinRight}>
                        <span className={styles.joinPrice}>
                          {formatDZD(opt.price, locale)}
                        </span>
                        <Link
                          href={`/courses/${course.id}/checkout?mode=${opt.mode}`}
                          className="btn btn-primary"
                        >
                          {t("courseDetail.join")} <i className="fa fa-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.panel} id="learn">
                <h2 className={styles.sectionTitle}>{t("courseDetail.learnTitle")}</h2>
                <CourseLearn course={course} enrolled={enrolled} />
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("courseDetail.mentorsTitle")}</h2>
                <div className={styles.mentorsGrid}>
                  <div className={styles.mentorCard}>
                    <div className={styles.mentorAvatar}>
                      <img src={mentorImage} alt={mentor?.name ?? "Mentor"} />
                    </div>
                    <div className={styles.mentorName}>
                      {mentor ? mentorDisplayName(mentor, locale) : ""}
                    </div>
                    <div className={styles.mentorSpecialty}>
                      {mentor ? tr(mentor.major, locale) : ""}
                    </div>
                    <Link
                      href={`/mentors/${course.mentorId}`}
                      className={styles.mentorBtn}
                    >
                      {t("courseDetail.viewProfile")} <i className="fa fa-arrow-right"></i>
                    </Link>
                  </div>

                  {otherMentors.map((m) => (
                    <div className={styles.mentorCard} key={m.id}>
                      <div className={styles.mentorAvatar}>
                        <img
                          src={m.profilePicture || "/images/mentor1.png"}
                          alt={m.name}
                        />
                      </div>
                      <div className={styles.mentorName}>
                        {mentorDisplayName(m, locale)}
                      </div>
                      <div className={styles.mentorSpecialty}>{tr(m.major, locale)}</div>
                      <Link href={`/mentors/${m.id}`} className={styles.mentorBtn}>
                        {t("courseDetail.viewProfile")} <i className="fa fa-arrow-right"></i>
                      </Link>
                    </div>
                  ))}
                </div>
                <p className={styles.description}>{t("courseDetail.mentorsNote")}</p>
              </div>

              {relatedCourses.length > 0 && (
                <div className={styles.panel}>
                  <h2 className={styles.sectionTitle}>{t("courseDetail.relatedTitle")}</h2>
                  <div className={styles.relatedList}>
                    {relatedCourses.map((rc) => (
                      <Link key={rc.id} href={`/courses/${rc.id}`}>
                        {tr(rc.subject, locale)}
                        <span className={styles.courseLevel}>{tr(rc.level, locale)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("review.title")}</h2>
                <CourseReviews course={course} enrolled={enrolled} />
              </div>
            </main>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <div className={styles.priceRow}>
                  <span className={styles.amount}>{formatDZD(course.price, locale)}</span>
                  <span className={styles.caption}>{t("courseDetail.priceCaption")}</span>
                </div>
                <ul className={styles.includesList}>
                  <li>
                    <i className="fa fa-graduation-cap"></i> {tr(course.tier, locale)} · {level}
                  </li>
                  <li>
                    <i className="fa fa-users"></i> {studentCount} {t("courseDetail.studentsEnrolled")}
                  </li>
                  <li>
                    <i className="fa fa-book"></i> {lessons.length} {t("courseDetail.lessonsWord")}
                  </li>
                  <li>
                    <i className="fa fa-calendar"></i> {formatDate(course.date, locale)}
                  </li>
                  <li>
                    <i className="fa fa-clock-o"></i> {t("courseDetail.startsAt")}{" "}
                    {formatTime(course.time, locale)}
                  </li>
                  <li>
                    <i className="fa fa-unlock-alt"></i> {t("courseDetail.lifetime")}
                  </li>
                </ul>
                {enrolled ? (
                  <>
                    <div className={styles.enrolledBadge}>
                      <i className="fa fa-check-circle"></i>{" "}
                      {t("courseDetail.enrolled")}
                    </div>
                    <a href="#learn" className={`btn btn-primary ${styles.fullBtn}`}>
                      {t("courseDetail.startLearning")}{" "}
                      <i className="fa fa-play"></i>
                    </a>
                  </>
                ) : (
                  <Link
                    href={`/courses/${course.id}/checkout?mode=recorded`}
                    className={`btn btn-primary ${styles.fullBtn}`}
                  >
                    {t("courseDetail.enrollNow")} <i className="fa fa-arrow-right"></i>
                  </Link>
                )}
                <div className={styles.favRow}>
                  <FavoriteButton courseId={course.id} variant="full" />
                </div>
              </div>

              <div className={styles.sidebarCard}>
                <h3>{t("courseDetail.newsletter")}</h3>
                <p>{t("courseDetail.newsletterText")}</p>
                <form className={styles.newsletterForm}>
                  <input type="email" placeholder={t("courseDetail.yourEmail")} required />
                  <button
                    type="submit"
                    className={`btn btn-secondary ${styles.fullBtn}`}
                  >
                    {t("courseDetail.subscribe")}
                  </button>
                </form>
              </div>

              <div className={styles.sidebarCard}>
                <h3>{t("courseDetail.needHelp")}</h3>
                <p>{t("courseDetail.needHelpText")}</p>
                <Link
                  href="/contact"
                  className={`btn btn-secondary ${styles.fullBtn}`}
                >
                  {t("courseDetail.contactSupport")}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
