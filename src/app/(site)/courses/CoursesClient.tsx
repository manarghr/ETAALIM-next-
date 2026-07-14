"use client";

import { useState } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CourseBanner from "@/components/CourseBanner";
import {
  filterCourses,
  courses,
  TIERS,
  Tier,
  Course,
  tracksForTier,
  getTrack,
  formatDZD,
} from "@/data/courses";
import { getMentorById } from "@/data/mentors";
import { tr, mentorDisplayName } from "@/data/localized";
import { cssVars, categoryAccent } from "@/lib/theme";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const COURSES_PER_PAGE = 6;

const tierIcons: Record<Tier, string> = {
  Primary: "fa-child",
  Middle: "fa-book",
  "High School": "fa-graduation-cap",
  University: "fa-university",
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// Algerian short code per course (5AP, 4AM, 3AS, or the LMD cycle).
function courseCode(c: Course): string {
  if (c.tier === "Primary") return `${c.year}AP`;
  if (c.tier === "Middle") return `${c.year}AM`;
  if (c.tier === "High School") return `${c.year}AS`;
  return getTrack(c.track)?.code ?? "";
}

export default function CoursesClient({
  sp,
}: {
  sp: { [key: string]: string | string[] | undefined };
}) {
  const { t, locale } = useI18n();

  // Initial values come from the URL (deep-linkable); after that everything is
  // client-side state so switching level / year filters instantly, without a
  // page navigation or scroll jump.
  const [tierFilter, setTierFilter] = useState(() => first(sp.tier));
  const [trackFilter, setTrackFilter] = useState(() => first(sp.track));
  const [search, setSearch] = useState(() => first(sp.search));
  const [page, setPage] = useState(1);

  const filtered = filterCourses({ search, tier: tierFilter, track: trackFilter });
  const totalCourses = filtered.length;
  const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const offset = (safePage - 1) * COURSES_PER_PAGE;
  const pageCourses = filtered.slice(offset, offset + COURSES_PER_PAGE);

  const tracks = tierFilter ? tracksForTier(tierFilter as Tier) : [];

  const pickTier = (tier: string) => {
    setTierFilter((prev) => (prev === tier ? "" : tier));
    setTrackFilter("");
    setPage(1);
  };
  const pickTrack = (track: string) => {
    setTrackFilter(track);
    setPage(1);
  };

  return (
    <>
      <PageHero
        eyebrowKey="pageHero.coursesEyebrow"
        titleKey="pageHero.coursesTitle"
        accentKey="pageHero.coursesAccent"
        subtitleKey="pageHero.coursesSubtitle"
        crumbKey="pageHero.coursesCrumb"
      />

      <div className={styles.wrap}>
        <div className="container">
          {/* Level selector */}
          <div className={styles.tierBar}>
            <div className={styles.tierHead}>
              <h2>{t("coursesPage.tierHeading")}</h2>
              <p>{t("coursesPage.tierSub")}</p>
            </div>
            <div className={styles.tierGrid}>
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => pickTier(tier)}
                  className={`${styles.tierCard} ${
                    tierFilter === tier ? styles.tierCardActive : ""
                  }`}
                >
                  <span className={styles.tierIcon}>
                    <i className={`fa ${tierIcons[tier]}`}></i>
                  </span>
                  <span className={styles.tierLabel}>{tr(tier, locale)}</span>
                  <span className={styles.tierCount}>
                    {courses.filter((c) => c.tier === tier).length}{" "}
                    {t("coursesPage.coursesWord")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Year / stream selector — appears once a level is chosen */}
          {tierFilter && tracks.length > 0 && (
            <div className={styles.trackBar}>
              <h3 className={styles.trackHeading}>{t("coursesPage.yearsHeading")}</h3>
              <div className={styles.trackChips}>
                <button
                  type="button"
                  onClick={() => pickTrack("")}
                  className={`${styles.trackChip} ${
                    !trackFilter ? styles.trackChipActive : ""
                  }`}
                >
                  {t("coursesPage.allYears")}
                </button>
                {tracks.map((tk) => (
                  <button
                    key={tk.key}
                    type="button"
                    onClick={() => pickTrack(tk.key)}
                    className={`${styles.trackChip} ${
                      trackFilter === tk.key ? styles.trackChipActive : ""
                    }`}
                  >
                    <b>{tk.code}</b> {t(`coursesPage.tracks.${tk.key}`)}
                    {tk.exam && (
                      <span className={styles.examTag}>
                        {t(`coursesPage.exam${tk.exam}`)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className={styles.toolbar}>
            <div className={styles.searchCard}>
              <div className={styles.searchInput}>
                <i className="fa fa-search"></i>
                <input
                  type="text"
                  name="search"
                  placeholder={t("coursesPage.searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <p className={styles.resultCount}>
            {t("coursesPage.showing")} <b>{pageCourses.length}</b>{" "}
            {t("coursesPage.of")} <b>{totalCourses}</b> {t("coursesPage.coursesWord")}
          </p>

          {/* Grid — keyed so it re-fades when the level/year/page changes */}
          <div className={styles.grid} key={`${tierFilter}-${trackFilter}-${safePage}`}>
            {pageCourses.length > 0 ? (
              pageCourses.map((course) => {
                const mentor = getMentorById(course.mentorId);
                const track = getTrack(course.track);
                const showExam =
                  track?.exam && course.year === (track.exam === "BEM" ? 4 : 3);
                return (
                  <div className={styles.card} key={course.id}>
                    <div className={styles.thumb}>
                      <CourseBanner subject={course.major} seed={course.id} />
                      <span
                        className={styles.chip}
                        style={cssVars(categoryAccent(course.major))}
                      >
                        {tr(course.major, locale)}
                      </span>
                      {showExam && (
                        <span className={styles.examBadge}>
                          {t(`coursesPage.exam${track!.exam}`)}
                        </span>
                      )}
                      <span className={styles.priceTag}>
                        {t("coursesPage.from")} {formatDZD(course.price)}
                      </span>
                    </div>
                    <div className={styles.body}>
                      <span className={styles.tierBadge}>
                        <i className={`fa ${tierIcons[course.tier]}`}></i>
                        {courseCode(course)}
                      </span>
                      <h3>{tr(course.subject, locale)}</h3>
                      <div className={styles.mentor}>
                        {mentor && <img src={mentor.profilePicture} alt={mentor.name} />}
                        {t("coursesPage.by")}{" "}
                        {mentor ? mentorDisplayName(mentor, locale) : ""}
                      </div>
                      <div className={styles.meta}>
                        <span>
                          <i className="fa fa-signal"></i>
                          {tr(course.level, locale)}
                        </span>
                        <span>
                          <i className="fa fa-layer-group"></i>
                          {t(`coursesPage.tracks.${course.track}`)}
                        </span>
                      </div>
                      <Link href={`/courses/${course.id}`} className={styles.link}>
                        {t("coursesPage.viewCourse")} <i className="fa fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <i className="fa fa-search"></i>
                {t("coursesPage.noResults")}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {safePage > 1 && (
                <button type="button" onClick={() => setPage(safePage - 1)}>
                  <i className="fa fa-angle-left"></i>
                </button>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={i === safePage ? styles.active : ""}
                >
                  {i}
                </button>
              ))}
              {safePage < totalPages && (
                <button type="button" onClick={() => setPage(safePage + 1)}>
                  <i className="fa fa-angle-right"></i>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
