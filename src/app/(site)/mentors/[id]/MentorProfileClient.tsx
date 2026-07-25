"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Mentor, mentorYearCodes, TeachTier } from "@/data/mentors";
import { isFollowing, toggleFollow } from "@/lib/follows";
import { getCoursesByMentor, formatDate, formatDZD } from "@/data/courses";
import {
  tr,
  trList,
  trSkills,
  mentorDisplayName,
  mentorDisplayTitle,
} from "@/data/localized";
import MentorMedia from "@/components/MentorMedia";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

export default function MentorProfileClient({ mentor }: { mentor: Mentor }) {
  const { t, locale } = useI18n();

  const mentorCourses = getCoursesByMentor(mentor.id);
  const skills = trSkills(mentor.skills, locale);

  // Localize the recorded-lesson titles before handing them to the player.
  const localizedLessons = mentor.lessons.map((l) => ({
    ...l,
    title: tr(l.title, locale),
  }));

  const displayName = mentorDisplayName(mentor, locale);

  // Follow state (from Supabase).
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    isFollowing(mentor.id).then(setFollowing);
  }, [mentor.id]);
  const onFollow = async () => {
    setFollowing(await toggleFollow(mentor.id, following));
  };

  return (
    <>
      {/* Profile header */}
      <section className={styles.profileHeader}>
        <div className="container">
          <div className={styles.headerInner}>
            <div className={styles.headerAvatar}>
              <img src={mentor.profilePicture} alt={mentor.name} />
            </div>
            <div className={styles.headerText}>
              <h1>{displayName}</h1>
              <p className={styles.headerTitle}>{mentorDisplayTitle(mentor.title, locale)}</p>
              <div className={styles.headerRating}>
                <span className={styles.stars}>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star-half-o"></i>
                </span>
                4.5 · 128 {t("mentorDetail.reviews")} · {mentor.experience}{" "}
                {t("mentorDetail.yearsExperience")}
              </div>
              <button
                type="button"
                onClick={onFollow}
                style={{
                  marginTop: 12,
                  padding: "9px 20px",
                  borderRadius: 999,
                  border: following ? "1px solid #cbd5e1" : "none",
                  background: following ? "transparent" : "var(--primary, #534ab7)",
                  color: following ? "inherit" : "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <i className={`fa ${following ? "fa-check" : "fa-plus"}`}></i>{" "}
                {following ? t("mentorDetail.following") : t("mentorDetail.follow")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.wrap}>
        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.card}>
                <h3>{t("mentorDetail.contact")}</h3>
                <div className={styles.contactList}>
                  <p>
                    <i className="fa fa-envelope"></i> {mentor.email}
                  </p>
                  <p>
                    <i className="fa fa-phone"></i> {mentor.phone}
                  </p>
                  <p>
                    <i className="fa fa-map-marker"></i> {t("mentorDetail.location")}
                  </p>
                </div>
                <a
                  href={`mailto:${mentor.email}`}
                  className={`btn btn-primary ${styles.fullBtn}`}
                >
                  <i className="fa fa-paper-plane"></i> {t("mentorDetail.contactMentor")}
                </a>
              </div>

              <div className={styles.card}>
                <h3>{t("mentorDetail.details")}</h3>
                <div className={styles.infoRow}>
                  <span>{t("mentorDetail.major")}</span>
                  <span>{tr(mentor.major, locale)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("mentorDetail.level")}</span>
                  <span>{tr(mentor.level, locale)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>{t("mentorDetail.experience")}</span>
                  <span>{mentor.experience} {t("mentorDetail.years")}</span>
                </div>
                {/* years covered, e.g. "1AM–4AM" (top year and everything below) */}
                {mentor.teaching.map((te) => {
                  const codes = mentorYearCodes(mentor, te.tier as TeachTier);
                  const range =
                    codes.length > 1 ? `${codes[0]}–${codes[codes.length - 1]}` : codes[0] ?? "";
                  return (
                    <div className={styles.infoRow} key={te.tier}>
                      <span>{t("mentorDetail.teaches")}</span>
                      <span>{range}</span>
                    </div>
                  );
                })}
                <div className={styles.infoRow}>
                  <span>{t("mentorDetail.coursesWord")}</span>
                  <span>{mentorCourses.length}</span>
                </div>
              </div>

              <div className={styles.card}>
                <h3>{t("mentorDetail.skills")}</h3>
                <div className={styles.skillTags}>
                  {skills.map((s) => (
                    <span key={s} className={styles.skillTag}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main */}
            <main className={styles.main}>
              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.aboutMe")}</h2>
                <p className={styles.aboutText}>{tr(mentor.bio, locale)}</p>
                <p className={styles.aboutText}>{t("mentorDetail.teachingPhilosophy")}</p>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.previewTitle")}</h2>
                <MentorMedia
                  poster={mentor.previewPoster}
                  video={mentor.previewVideo}
                  lessons={localizedLessons}
                />
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.certifications")}</h2>
                <div className={styles.certGrid}>
                  {mentor.certificates.map((c) => (
                    <div className={styles.certCard} key={c.name}>
                      <div className={styles.certIcon}>
                        <i className="fa fa-graduation-cap"></i>
                      </div>
                      <div>
                        <div className={styles.certName}>{c.name}</div>
                        <div className={styles.certIssuer}>
                          {c.issuer} ·{" "}
                          <span className={styles.certYear}>{c.year}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.achievements")}</h2>
                <div className={styles.achList}>
                  {trList(mentor.achievements, locale).map((a) => (
                    <div className={styles.achItem} key={a}>
                      <i className="fa fa-trophy"></i>
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.myCourses")}</h2>
                {mentorCourses.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.coursesTable}>
                      <thead>
                        <tr>
                          <th>{t("mentorDetail.thSubject")}</th>
                          <th>{t("mentorDetail.thLevel")}</th>
                          <th>{t("mentorDetail.thDate")}</th>
                          <th>{t("mentorDetail.thPrice")}</th>
                          <th>{t("mentorDetail.thAction")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentorCourses.map((course) => (
                          <tr key={course.id}>
                            <td>{tr(course.subject, locale)}</td>
                            <td>{tr(course.level, locale)}</td>
                            <td>{formatDate(course.date, locale)}</td>
                            <td className={styles.price}>
                              {formatDZD(course.price, locale)}
                            </td>
                            <td>
                              <Link
                                href={`/courses/${course.id}`}
                                className={styles.tableBtn}
                              >
                                {t("mentorDetail.view")} <i className="fa fa-arrow-right"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.aboutText}>{t("mentorDetail.noCourses")}</p>
                )}
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.addReview")}</h2>
                <form className={styles.reviewForm}>
                  <textarea placeholder={t("mentorDetail.reviewPlaceholder")}></textarea>
                  <button type="submit" className="btn btn-primary">
                    {t("mentorDetail.submitReview")}
                  </button>
                </form>
              </div>

              <div className={styles.panel}>
                <h2 className={styles.sectionTitle}>{t("mentorDetail.studentNotes")}</h2>
                <p className={styles.locked}>{t("mentorDetail.notesLocked")}</p>
                <div className={styles.note}>
                  <p className={styles.noteAuthor}>Isabella Shoria</p>
                  <p className={styles.noteText}>{t("mentorDetail.note1")}</p>
                </div>
                <div className={styles.note}>
                  <p className={styles.noteAuthor}>Diego Cuzumim</p>
                  <p className={styles.noteText}>{t("mentorDetail.note2")}</p>
                </div>
                <div className={styles.note}>
                  <p className={styles.noteAuthor}>Sula Miranda Silva</p>
                  <p className={styles.noteText}>
                    {t("mentorDetail.note3").replace("{major}", tr(mentor.major, locale))}
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
