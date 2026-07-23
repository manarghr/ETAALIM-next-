"use client";

import Link from "next/link";
import PageHero from "@/components/PageHero";
import {
  filterMentors,
  getMentorMajors,
  mentorTeachesTier,
  mentorTeachesYear,
  mentorYearCodes,
  Mentor,
  TEACH_YEARS,
  TeachTier,
} from "@/data/mentors";
import { tr, mentorDisplayName, mentorDisplayTitle } from "@/data/localized";
import { cssVars, categoryAccent } from "@/lib/theme";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const MENTORS_PER_PAGE = 9;

const LEVELS: { tier: TeachTier; labelKey: string }[] = [
  { tier: "Primary", labelKey: "auth.cyclePrimary" },
  { tier: "Middle", labelKey: "auth.cycleMiddle" },
  { tier: "High School", labelKey: "auth.cycleHigh" },
  { tier: "University", labelKey: "auth.cycleUniversity" },
];

// "1AP–5AP" for a range, or the single year code.
function teachRange(m: Mentor, tier: TeachTier): string {
  const codes = mentorYearCodes(m, tier);
  if (codes.length === 0) return "";
  return codes.length > 1 ? `${codes[0]}–${codes[codes.length - 1]}` : codes[0];
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function MentorsClient({
  sp,
}: {
  sp: { [key: string]: string | string[] | undefined };
}) {
  const { t, locale } = useI18n();

  const search = first(sp.search);
  const major = first(sp.major) || "All";
  // level + year filters (a 5AP mentor also answers a 2AP search — coverage
  // extends down to the younger years of their cycle)
  const level = first(sp.level) as TeachTier | "";
  const year = first(sp.year);
  let page = parseInt(first(sp.page), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  const majors = ["All", ...getMentorMajors()];
  const filtered = filterMentors({ search, major }).filter((m) => {
    if (!level) return true;
    return year ? mentorTeachesYear(m, level, year) : mentorTeachesTier(m, level);
  });
  const totalPages = Math.ceil(filtered.length / MENTORS_PER_PAGE);
  const offset = (page - 1) * MENTORS_PER_PAGE;
  const pageMentors = filtered.slice(offset, offset + MENTORS_PER_PAGE);

  const buildHref = (over: { major?: string; level?: string; year?: string; page?: number }) => {
    const params = new URLSearchParams();
    const mj = over.major ?? major;
    const lv = over.level ?? level;
    const yr = over.year ?? year;
    if (mj !== "All") params.set("major", mj);
    if (lv) params.set("level", lv);
    if (lv && yr) params.set("year", yr);
    if (search) params.set("search", search);
    if (over.page && over.page > 1) params.set("page", String(over.page));
    const qs = params.toString();
    return qs ? `/mentors?${qs}` : "/mentors";
  };

  const chipHref = (m: string) => buildHref({ major: m });
  const pageHref = (p: number) => buildHref({ page: p });

  return (
    <>
      <PageHero
        eyebrowKey="pageHero.mentorsEyebrow"
        titleKey="pageHero.mentorsTitle"
        accentKey="pageHero.mentorsAccent"
        subtitleKey="pageHero.mentorsSubtitle"
        crumbKey="pageHero.mentorsCrumb"
      />

      <div className={styles.wrap}>
        <div className="container">
          {/* Toolbar: search + filter chips */}
          <div className={styles.toolbar}>
            <div className={styles.searchCard}>
              <form className={styles.searchBar} method="get" action="/mentors">
                {major !== "All" && (
                  <input type="hidden" name="major" value={major} />
                )}
                {level && <input type="hidden" name="level" value={level} />}
                {level && year && <input type="hidden" name="year" value={year} />}
                <div className={styles.searchInput}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    name="search"
                    placeholder={t("mentorsPage.searchPlaceholder")}
                    defaultValue={search}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  {t("mentorsPage.search")}
                </button>
              </form>

              <div className={styles.chips}>
                {majors.map((m) => (
                  <Link
                    key={m}
                    href={chipHref(m)}
                    className={`${styles.chip} ${
                      m === major ? styles.chipActive : ""
                    }`}
                    style={m !== "All" ? cssVars(categoryAccent(m)) : undefined}
                  >
                    {m === "All" ? t("mentorsPage.all") : tr(m, locale)}
                  </Link>
                ))}
              </div>

              {/* Education level — same cycles students pick at signup */}
              <div className={styles.chips}>
                <Link
                  href={buildHref({ level: "", year: "" })}
                  className={`${styles.chip} ${!level ? styles.chipActive : ""}`}
                >
                  {t("admin.allLevels")}
                </Link>
                {LEVELS.map((lv) => (
                  <Link
                    key={lv.tier}
                    href={buildHref({ level: lv.tier, year: "" })}
                    className={`${styles.chip} ${level === lv.tier ? styles.chipActive : ""}`}
                  >
                    {t(lv.labelKey)}
                  </Link>
                ))}
              </div>

              {/* Year within the level — a 5AP mentor shows under 1AP–4AP too */}
              {level && (
                <div className={styles.chips}>
                  <Link
                    href={buildHref({ year: "" })}
                    className={`${styles.chip} ${!year ? styles.chipActive : ""}`}
                  >
                    {t("admin.allYears")}
                  </Link>
                  {TEACH_YEARS[level].map((code) => (
                    <Link
                      key={code}
                      href={buildHref({ year: code })}
                      className={`${styles.chip} ${year === code ? styles.chipActive : ""}`}
                    >
                      {code}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className={styles.resultCount}>
            <b>{filtered.length}</b> {t("mentorsPage.mentorsWord")}
            {major !== "All" ? (
              <>
                {" "}
                {t("mentorsPage.inWord")} <b>{tr(major, locale)}</b>
              </>
            ) : null}
            {search ? (
              <>
                {" "}
                {t("mentorsPage.matching")} &quot;<b>{search}</b>&quot;
              </>
            ) : null}
          </p>

          {/* Grid */}
          <div className={styles.grid}>
            {pageMentors.length > 0 ? (
              pageMentors.map((mentor) => (
                <div className={styles.card} key={mentor.id}>
                  <div className={styles.cardTop}>
                    <div className={styles.avatar}>
                      <img src={mentor.profilePicture} alt={mentor.name} />
                      <span className={styles.verified} title="Verified mentor">
                        <i className="fa fa-check"></i>
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <h4 className={styles.name}>{mentorDisplayName(mentor, locale)}</h4>
                    <p className={styles.title}>{mentorDisplayTitle(mentor.title, locale)}</p>
                    <p className={styles.bio}>{tr(mentor.shortBio, locale)}</p>
                    <div className={styles.tags}>
                      <span
                        className={styles.tag}
                        style={cssVars(categoryAccent(mentor.major))}
                      >
                        {tr(mentor.major, locale)}
                      </span>
                      <span className={styles.tag}>
                        {mentor.experience} {t("mentorsPage.yrsExp")}
                      </span>
                      {/* years they teach, e.g. "1AP–5AP" */}
                      {mentor.teaching.map((te) => (
                        <span key={te.tier} className={styles.tag}>
                          <i className="fa fa-graduation-cap"></i>{" "}
                          {teachRange(mentor, te.tier)}
                        </span>
                      ))}
                    </div>
                    <div className={styles.stars}>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star-half-o"></i>
                      <span>4.5 (128)</span>
                    </div>
                    <div className={styles.footer}>
                      <Link href={`/mentors/${mentor.id}`} className={styles.link}>
                        {t("mentorsPage.viewProfile")} <i className="fa fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <i className="fa fa-user-o"></i>
                {t("mentorsPage.noResults")}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
                <Link
                  key={i}
                  href={pageHref(i)}
                  className={i === page ? styles.active : ""}
                >
                  {i}
                </Link>
              ))}
            </div>
          )}

          {/* Why learn with our mentors */}
          <section className={styles.why}>
            <div className={styles.whyHead}>
              <h2>{t("mentorsPage.whyTitle")}</h2>
              <p>{t("mentorsPage.whySubtitle")}</p>
            </div>
            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>
                  <i className="fa fa-check-circle"></i>
                </div>
                <h3>{t("mentorsPage.why1t")}</h3>
                <p>{t("mentorsPage.why1d")}</p>
              </div>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>
                  <i className="fa fa-users"></i>
                </div>
                <h3>{t("mentorsPage.why2t")}</h3>
                <p>{t("mentorsPage.why2d")}</p>
              </div>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>
                  <i className="fa fa-clock-o"></i>
                </div>
                <h3>{t("mentorsPage.why3t")}</h3>
                <p>{t("mentorsPage.why3d")}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
