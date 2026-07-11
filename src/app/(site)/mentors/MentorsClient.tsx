"use client";

import Link from "next/link";
import PageHero from "@/components/PageHero";
import { filterMentors, getMentorMajors } from "@/data/mentors";
import { tr, mentorDisplayName, mentorDisplayTitle } from "@/data/localized";
import { cssVars, categoryAccent } from "@/lib/theme";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const MENTORS_PER_PAGE = 9;

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
  let page = parseInt(first(sp.page), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  const majors = ["All", ...getMentorMajors()];
  const filtered = filterMentors({ search, major });
  const totalPages = Math.ceil(filtered.length / MENTORS_PER_PAGE);
  const offset = (page - 1) * MENTORS_PER_PAGE;
  const pageMentors = filtered.slice(offset, offset + MENTORS_PER_PAGE);

  const chipHref = (m: string) => {
    const params = new URLSearchParams();
    if (m !== "All") params.set("major", m);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/mentors?${qs}` : "/mentors";
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    if (major !== "All") params.set("major", major);
    if (search) params.set("search", search);
    return `/mentors?${params.toString()}`;
  };

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
        </div>
      </div>
    </>
  );
}
