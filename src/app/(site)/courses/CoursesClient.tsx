"use client";

import Link from "next/link";
import PageHero from "@/components/PageHero";
import {
  filterCourses,
  getMajors,
  getLevels,
  formatDate,
  formatDZD,
  courses,
  TIERS,
  Tier,
} from "@/data/courses";
import { getMentorById } from "@/data/mentors";
import { tr, mentorDisplayName } from "@/data/localized";
import { cssVars, categoryAccent } from "@/lib/theme";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const COURSES_PER_PAGE = 6;

const tierIcons: Record<string, string> = {
  All: "fa-th-large",
  Primary: "fa-child",
  Middle: "fa-book",
  "High School": "fa-graduation-cap",
  University: "fa-university",
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function CoursesClient({
  sp,
}: {
  sp: { [key: string]: string | string[] | undefined };
}) {
  const { t, locale } = useI18n();

  const search = first(sp.search);
  const majorFilter = first(sp.major);
  const levelFilter = first(sp.level);
  const tierFilter = first(sp.tier) || "All";
  let page = parseInt(first(sp.page), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  const majors = getMajors();
  const levels = getLevels();

  const filtered = filterCourses({
    search,
    major: majorFilter,
    level: levelFilter,
    tier: tierFilter,
  });
  const totalCourses = filtered.length;
  const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
  const offset = (page - 1) * COURSES_PER_PAGE;
  const pageCourses = filtered.slice(offset, offset + COURSES_PER_PAGE);

  const tierOptions: { value: string; label: string; count: number }[] = [
    { value: "All", label: t("coursesPage.allLevels"), count: courses.length },
    ...TIERS.map((tier) => ({
      value: tier,
      label: tr(tier, locale),
      count: courses.filter((c) => c.tier === tier).length,
    })),
  ];

  const tierHref = (tier: string) => {
    const params = new URLSearchParams();
    if (tier !== "All") params.set("tier", tier);
    if (search) params.set("search", search);
    if (majorFilter) params.set("major", majorFilter);
    if (levelFilter) params.set("level", levelFilter);
    const qs = params.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (tierFilter !== "All") params.set("tier", tierFilter);
    if (search) params.set("search", search);
    if (majorFilter) params.set("major", majorFilter);
    if (levelFilter) params.set("level", levelFilter);
    return `/courses?${params.toString()}`;
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
          {/* Age-tier selector */}
          <div className={styles.tierBar}>
            <div className={styles.tierHead}>
              <h2>{t("coursesPage.tierHeading")}</h2>
              <p>{t("coursesPage.tierSub")}</p>
            </div>
            <div className={styles.tierGrid}>
              {tierOptions.map((opt) => (
                <Link
                  key={opt.value}
                  href={tierHref(opt.value)}
                  className={`${styles.tierCard} ${
                    tierFilter === opt.value ? styles.tierCardActive : ""
                  }`}
                >
                  <span className={styles.tierIcon}>
                    <i className={`fa ${tierIcons[opt.value]}`}></i>
                  </span>
                  <span className={styles.tierLabel}>{opt.label}</span>
                  <span className={styles.tierCount}>
                    {opt.count} {t("coursesPage.coursesWord")}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Search toolbar */}
          <div className={styles.toolbar}>
            <form className={styles.searchCard} method="get" action="/courses">
              {tierFilter !== "All" && (
                <input type="hidden" name="tier" value={tierFilter} />
              )}
              <div className={styles.searchForm}>
                <div className={styles.searchInput}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    name="search"
                    placeholder={t("coursesPage.searchPlaceholder")}
                    defaultValue={search}
                  />
                </div>
                <select name="major" title={t("coursesPage.allCategories")} defaultValue={majorFilter}>
                  <option value="">{t("coursesPage.allCategories")}</option>
                  {majors.map((m) => (
                    <option key={m} value={m}>
                      {tr(m, locale)}
                    </option>
                  ))}
                </select>
                <select name="level" title={t("coursesPage.allLevelsOpt")} defaultValue={levelFilter}>
                  <option value="">{t("coursesPage.allLevelsOpt")}</option>
                  {levels.map((l) => (
                    <option key={l} value={l}>
                      {tr(l, locale)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  <i className="fa fa-sliders"></i> {t("coursesPage.filter")}
                </button>
              </div>
            </form>
          </div>

          <p className={styles.resultCount}>
            {t("coursesPage.showing")} <b>{pageCourses.length}</b>{" "}
            {t("coursesPage.of")} <b>{totalCourses}</b> {t("coursesPage.coursesWord")}
            {tierFilter !== "All" ? (
              <>
                {" "}
                {t("coursesPage.forWord")} <b>{tr(tierFilter, locale)}</b>
              </>
            ) : null}
          </p>

          {/* Grid */}
          <div className={styles.grid}>
            {pageCourses.length > 0 ? (
              pageCourses.map((course) => {
                const mentor = getMentorById(course.mentorId);
                return (
                  <div className={styles.card} key={course.id}>
                    <div className={styles.thumb}>
                      <img src="/images/courses.jpg" alt={tr(course.subject, locale)} />
                      <span
                        className={styles.chip}
                        style={cssVars(categoryAccent(course.major))}
                      >
                        {tr(course.major, locale)}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          course.status === "upcoming" ? styles.statusUpcoming : ""
                        }`}
                      >
                        {course.status === "upcoming"
                          ? t("coursesPage.upcoming")
                          : t("coursesPage.available")}
                      </span>
                      <span className={styles.priceTag}>
                        {t("coursesPage.from")} {formatDZD(course.price)}
                      </span>
                    </div>
                    <div className={styles.body}>
                      <span className={styles.tierBadge}>
                        <i className={`fa ${tierIcons[course.tier as Tier]}`}></i>
                        {tr(course.tier, locale)}
                      </span>
                      <h3>{tr(course.subject, locale)}</h3>
                      <div className={styles.mentor}>
                        {mentor && (
                          <img src={mentor.profilePicture} alt={mentor.name} />
                        )}
                        {t("coursesPage.by")}{" "}
                        {mentor ? mentorDisplayName(mentor, locale) : ""}
                      </div>
                      <div className={styles.meta}>
                        <span>
                          <i className="fa fa-signal"></i>
                          {tr(course.level, locale)}
                        </span>
                        <span>
                          <i className="fa fa-calendar"></i>
                          {formatDate(course.date)}
                        </span>
                      </div>
                      <Link
                        href={`/courses/${course.id}`}
                        className={styles.link}
                      >
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
              {page > 1 && (
                <Link href={buildHref(page - 1)}>
                  <i className="fa fa-angle-left"></i>
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                <Link
                  key={i}
                  href={buildHref(i)}
                  className={i === page ? styles.active : ""}
                >
                  {i}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={buildHref(page + 1)}>
                  <i className="fa fa-angle-right"></i>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
