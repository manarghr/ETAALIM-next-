"use client";

import SmartImage from "@/components/SmartImage";
import { useState, useEffect } from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CourseBanner from "@/components/CourseBanner";
import FavoriteButton from "@/components/FavoriteButton";
import {
  courses,
  TIERS,
  Tier,
  Course,
  NavNode,
  navRoots,
  resolveNavPath,
  leafTracks,
  getTrack,
  formatDZD,
} from "@/data/courses";
import { effectiveCourses } from "@/lib/catalog";
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
  const [navPath, setNavPath] = useState<string[]>(() => {
    const t0 = first(sp.track);
    return t0 ? [t0] : [];
  });
  const [search, setSearch] = useState(() => first(sp.search));
  const [page, setPage] = useState(1);

  // SSR renders the static catalog; on mount swap to the effective one (the
  // admin's edits, deletions and additions — stored client-side).
  const [catalog, setCatalog] = useState<Course[]>(courses);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    effectiveCourses().then(setCatalog);
  }, []);

  // Resolve the current position inside the active tier's drill-down tree.
  const chain = tierFilter ? resolveNavPath(tierFilter as Tier, navPath) : [];
  const deepest = chain[chain.length - 1];

  // Work out (a) the chips to show at the current level, (b) the breadcrumb
  // trail, and (c) which leaf (if any) is currently selected/highlighted.
  let levelNodes: NavNode[] = [];
  let crumbs: NavNode[] = [];
  let activeKey: string | null = null;
  if (tierFilter) {
    if (!deepest) {
      levelNodes = navRoots(tierFilter as Tier);
    } else if (deepest.children) {
      levelNodes = deepest.children;
      crumbs = chain;
    } else {
      // a leaf is selected — keep its siblings visible and highlight it
      const parent = chain[chain.length - 2];
      levelNodes = parent?.children ?? navRoots(tierFilter as Tier);
      crumbs = chain.slice(0, -1);
      activeKey = deepest.key;
    }
  }

  // Courses shown = union of every leaf track under the deepest selected node.
  const activeTracks = deepest ? leafTracks(deepest) : [];
  const q = search.trim().toLowerCase();
  const filtered = catalog.filter((c) => {
    if (tierFilter !== "" && tierFilter !== "All" && c.tier !== tierFilter) return false;
    if (activeTracks.length > 0 && !activeTracks.includes(c.track)) return false;
    if (
      q !== "" &&
      !c.subject.toLowerCase().includes(q) &&
      !c.major.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
  const totalCourses = filtered.length;
  const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const offset = (safePage - 1) * COURSES_PER_PAGE;
  const pageCourses = filtered.slice(offset, offset + COURSES_PER_PAGE);

  // The revision promo only shows once the exam year itself is chosen.
  const showBem = tierFilter === "Middle" && navPath.includes("m4");
  const showBac = tierFilter === "High School" && navPath.includes("3as");

  const pickTier = (tier: string) => {
    setTierFilter((prev) => (prev === tier ? "" : tier));
    setNavPath([]);
    setPage(1);
  };
  // Drill into (branch) or select (leaf) a node at the current level.
  const pickNode = (node: NavNode) => {
    setNavPath([...crumbs.map((n) => n.key), node.key]);
    setPage(1);
  };
  // Jump back up the breadcrumb (index -1 = back to the top level).
  const goToCrumb = (index: number) => {
    setNavPath(index < 0 ? [] : crumbs.slice(0, index + 1).map((n) => n.key));
    setPage(1);
  };
  const scrollToResults = () =>
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });

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
                    {catalog.filter((c) => c.tier === tier).length}{" "}
                    {t("coursesPage.coursesWord")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Year / stream selector — drill-down, appears once a level is chosen */}
          {tierFilter && (
            <div className={styles.trackBar}>
              <h3 className={styles.trackHeading}>{t("coursesPage.yearsHeading")}</h3>

              {/* Breadcrumb — only once the user has drilled past the top level */}
              {crumbs.length > 0 && (
                <div className={styles.breadcrumb}>
                  <button type="button" onClick={() => goToCrumb(-1)}>
                    {t("coursesPage.allYears")}
                  </button>
                  {crumbs.map((node, i) => (
                    <span key={node.key} className={styles.crumbItem}>
                      <i className="fa fa-angle-right"></i>
                      <button type="button" onClick={() => goToCrumb(i)}>
                        {node.code && <b>{node.code}</b>}{" "}
                        {t(`coursesPage.nav.${node.label}`)}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Chips for the current level */}
              <div className={styles.trackChips}>
                {crumbs.length === 0 && (
                  <button
                    type="button"
                    onClick={() => goToCrumb(-1)}
                    className={`${styles.trackChip} ${
                      !deepest ? styles.trackChipActive : ""
                    }`}
                  >
                    {t("coursesPage.allYears")}
                  </button>
                )}
                {levelNodes.map((node) => (
                  <button
                    key={node.key}
                    type="button"
                    onClick={() => pickNode(node)}
                    className={`${styles.trackChip} ${
                      activeKey === node.key ? styles.trackChipActive : ""
                    }`}
                  >
                    {node.code && <b>{node.code}</b>}{" "}
                    {t(`coursesPage.nav.${node.label}`)}
                    {node.exam && (
                      <span className={styles.examTag}>
                        {t(`coursesPage.exam${node.exam}`)}
                      </span>
                    )}
                    {node.children && (
                      <i className={`fa fa-angle-right ${styles.chipArrow}`}></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exam-year revision promo — only after the exam year is chosen */}
          {(showBem || showBac) && (
            <section className={styles.examPrep}>
              <div className={styles.examPrepHead}>
                <span className={styles.examEyebrow}>
                  <i className="fa fa-bolt"></i> {t("coursesPage.examPrep.eyebrow")}
                </span>
                <h2>{t("coursesPage.examPrep.title")}</h2>
                <p>{t("coursesPage.examPrep.subtitle")}</p>
              </div>
              <div className={styles.examCards}>
                {showBem && (
                  <div
                    className={styles.examCard}
                    style={
                      {
                        "--ac": "var(--primary)",
                        "--ac-glow": "rgba(83, 74, 183, 0.4)",
                        "--ac-text": "#b7b1ef",
                      } as React.CSSProperties
                    }
                  >
                    <div className={styles.examCardTop}>
                      <span className={styles.examAbbr}>
                        <span>BEM</span>
                        {t("coursesPage.examPrep.bemFor")}
                      </span>
                      <span className={styles.discount}>
                        <b>{t("coursesPage.examPrep.discount")}</b>
                        <small>{t("coursesPage.examPrep.off")}</small>
                      </span>
                    </div>
                    <h3>{t("coursesPage.examPrep.bemName")}</h3>
                    <p className={styles.examCardDesc}>
                      {t("coursesPage.examPrep.bemDesc")}
                    </p>
                    <ul className={styles.examPerks}>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk1")}</li>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk2")}</li>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk3")}</li>
                    </ul>
                    <button
                      type="button"
                      className={styles.examCta}
                      onClick={scrollToResults}
                    >
                      {t("coursesPage.examPrep.bemCta")}{" "}
                      <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                )}
                {showBac && (
                  <div
                    className={styles.examCard}
                    style={
                      {
                        "--ac": "#1d9e75",
                        "--ac-glow": "rgba(29, 158, 117, 0.4)",
                        "--ac-text": "#9be7cd",
                      } as React.CSSProperties
                    }
                  >
                    <div className={styles.examCardTop}>
                      <span className={styles.examAbbr}>
                        <span>BAC</span>
                        {t("coursesPage.examPrep.bacFor")}
                      </span>
                      <span className={styles.discount}>
                        <b>{t("coursesPage.examPrep.discount")}</b>
                        <small>{t("coursesPage.examPrep.off")}</small>
                      </span>
                    </div>
                    <h3>{t("coursesPage.examPrep.bacName")}</h3>
                    <p className={styles.examCardDesc}>
                      {t("coursesPage.examPrep.bacDesc")}
                    </p>
                    <ul className={styles.examPerks}>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk1")}</li>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk2")}</li>
                      <li><i className="fa fa-check"></i> {t("coursesPage.examPrep.perk3")}</li>
                    </ul>
                    <button
                      type="button"
                      className={styles.examCta}
                      onClick={scrollToResults}
                    >
                      {t("coursesPage.examPrep.bacCta")}{" "}
                      <i className="fa fa-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Search */}
          <div className={styles.toolbar} id="browse">
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
          <div className={styles.grid} key={`${tierFilter}-${navPath.join(".")}-${safePage}`}>
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
                        {t("coursesPage.from")} {formatDZD(course.price, locale)}
                      </span>
                      <span className={styles.favCorner}>
                        <FavoriteButton courseId={course.id} />
                      </span>
                    </div>
                    <div className={styles.body}>
                      <span className={styles.tierBadge}>
                        <i className={`fa ${tierIcons[course.tier]}`}></i>
                        {courseCode(course)}
                      </span>
                      <h3>{tr(course.subject, locale)}</h3>
                      <div className={styles.mentor}>
                        {mentor && (
                          <SmartImage src={mentor.profilePicture} alt={mentor.name} width={40} height={40} />
                        )}
                        {t("coursesPage.by")}{" "}
                        {mentor ? mentorDisplayName(mentor, locale) : ""}
                      </div>
                      <div className={styles.meta}>
                      
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
