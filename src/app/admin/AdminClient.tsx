"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/translations";
import { tr, mentorDisplayName } from "@/data/localized";
import {
  mentors,
  getMentorById,
  mentorTeachesTier,
  mentorTeachesYear,
  mentorYearCodes,
  TEACH_YEARS,
  TeachTier,
} from "@/data/mentors";
import {
  courses,
  getCourseById,
  formatDZD,
  formatDate,
  TIERS,
  TRACKS,
} from "@/data/courses";
import CourseBanner from "@/components/CourseBanner";
import { cssVars, categoryAccent } from "@/lib/theme";
import { CYCLE_ORDER, StudentRecord } from "@/data/students";
import { getAllStudents } from "@/lib/adminStudents";
import { YEARS, educationLabel, Cycle } from "@/data/education";
import { getReviews, averageRating, reviewCount } from "@/lib/reviews";
import { isAdminUnlocked, unlockAdmin, lockAdmin } from "@/lib/admin";
import {
  getAdminCourses,
  addAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  assignMentor,
  unassignMentor,
  AdminCourse,
  AdminCourseInput,
} from "@/lib/adminCourses";
import styles from "./admin.module.css";

type Section = "overview" | "students" | "courses" | "mentors";

const NAV: { key: Section; labelKey: string; icon: string }[] = [
  { key: "overview", labelKey: "admin.navOverview", icon: "fa-th-large" },
  { key: "students", labelKey: "admin.navStudents", icon: "fa-users" },
  { key: "courses", labelKey: "admin.navCourses", icon: "fa-book" },
  { key: "mentors", labelKey: "admin.navMentors", icon: "fa-graduation-cap" },
];

const CYCLE_KEY: Record<Cycle, string> = {
  primary: "auth.cyclePrimary",
  middle: "auth.cycleMiddle",
  high: "auth.cycleHigh",
  university: "auth.cycleUniversity",
};

// Course tiers reuse the same level labels as the student cycles.
const TIER_KEY: Record<string, string> = {
  Primary: "auth.cyclePrimary",
  Middle: "auth.cycleMiddle",
  "High School": "auth.cycleHigh",
  University: "auth.cycleUniversity",
};

// Same tier icons as the public courses page, so cards read identically.
const TIER_ICONS: Record<string, string> = {
  Primary: "fa-child",
  Middle: "fa-book",
  "High School": "fa-graduation-cap",
  University: "fa-university",
};

const EMPTY_COURSE: AdminCourseInput = {
  subject: "",
  description: "",
  major: "",
  tier: "High School",
  track: "",
  level: "",
  price: 1500,
  priceGroup: 3000,
  priceIndividual: 6000,
  date: "",
  time: "",
  status: "available",
  mentorIds: [],
};

const LANGS: { code: Locale; flag: string }[] = [
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "ar", flag: "🇩🇿" },
];

export default function AdminClient() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const [section, setSection] = useState<Section>("overview");
  const [cycleFilter, setCycleFilter] = useState<Cycle | "all">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseTier, setCourseTier] = useState<string>("all");
  const [courseYear, setCourseYear] = useState<string>("all");
  // high-school stream (track key) within the selected year — 1AS splits into
  // Science/Letters common cores, 2AS & 3AS into their streams
  const [courseStream, setCourseStream] = useState<string>("all");
  const [active, setActive] = useState<StudentRecord | null>(null);

  // Mentor filters (level → year, like the student directory)
  const [mentorTier, setMentorTier] = useState<TeachTier | "all">("all");
  const [mentorYear, setMentorYear] = useState<string>("all");
  const [mentorSearch, setMentorSearch] = useState("");

  // Students = demo directory + everyone who registered through the signup form.
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);

  // Course management
  const [adminCourses, setAdminCourses] = useState<AdminCourse[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [courseEditing, setCourseEditing] = useState<AdminCourse | "new" | null>(null);
  const [cform, setCform] = useState<AdminCourseInput>(EMPTY_COURSE);
  const [primaryMentor, setPrimaryMentor] = useState<number>(mentors[0].id);
  const [courseDelete, setCourseDelete] = useState<AdminCourse | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setUnlocked(isAdminUnlocked());
    getAdminCourses().then(setAdminCourses);
    getAllStudents().then(setAllStudents);
  }, []);

  // Escape closes whichever modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setCourseEditing(null);
        setCourseDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const money = (n: number) => formatDZD(n, locale);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  // Enrollment counts per course, from the student directory.
  const enrolledByCourse = useMemo(() => {
    const map = new Map<number, number>();
    allStudents.forEach((s) =>
      s.enrolledCourseIds.forEach((id) => map.set(id, (map.get(id) ?? 0) + 1))
    );
    return map;
  }, [allStudents]);

  // Directory counts (demo + registered).
  const cycleCount = (cy: Cycle) => allStudents.filter((s) => s.cycle === cy).length;
  const cycleYearCount = (cy: Cycle, y: string) =>
    allStudents.filter((s) => s.cycle === cy && s.year === y).length;

  if (!mounted) return <div className={styles.wrap} />;

  // ===== Password gate =====
  if (!unlocked) {
    return (
      <div className={styles.gateWrap}>
        <form className={styles.gateCard} onSubmit={submit}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="E-Taalim" className={styles.gateLogo} />
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
        </form>
      </div>
    );
  }

  // ===== Aggregations (over the admin-managed course list, held in state) =====
  const enrollments = allStudents.reduce((s, st) => s + st.enrolledCourseIds.length, 0);
  const reviewsTotal = courses.reduce((s, c) => s + reviewCount(c.id), 0);
  const ratings = courses.map((c) => averageRating(c.id)).filter((r) => r > 0);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;
  const revenue = adminCourses.reduce(
    (s, c) => s + c.price * (enrolledByCourse.get(c.id) ?? 0),
    0
  );

  const stats = [
    { icon: "fa-graduation-cap", color: "#534ab7", value: mentors.length, label: t("admin.statMentors") },
    { icon: "fa-book", color: "#1d9e75", value: adminCourses.length, label: t("admin.statCourses") },
    { icon: "fa-users", color: "#e0894a", value: allStudents.length, label: t("admin.statStudents") },
    { icon: "fa-check-circle", color: "#534ab7", value: enrollments, label: t("admin.statEnrollments") },
    { icon: "fa-star", color: "#f5a623", value: reviewsTotal, label: t("admin.statReviews") },
    { icon: "fa-star-half-o", color: "#e0894a", value: avgRating.toFixed(1), label: t("admin.statRating") },
    { icon: "fa-money", color: "#1d9e75", value: money(revenue), label: t("admin.statRevenue") },
  ];

  const mentorRows = mentors.map((mt) => {
    const mc = adminCourses.filter((c) => c.mentorIds.includes(mt.id));
    const st = mc.reduce((s, c) => s + (enrolledByCourse.get(c.id) ?? 0), 0);
    return { mt, courses: mc.length, students: st, rating: (4.6 + (mt.id % 4) * 0.1).toFixed(1) };
  });

  // Level/year mentor filter. A mentor qualified for a year also appears under
  // every younger year of the same cycle (5AP covers 1AP–4AP, 4AM covers 1AM–3AM…).
  const filteredMentorRows = mentorRows.filter(({ mt }) => {
    if (mentorTier !== "all") {
      if (mentorYear === "all") {
        if (!mentorTeachesTier(mt, mentorTier)) return false;
      } else if (!mentorTeachesYear(mt, mentorTier, mentorYear)) {
        return false;
      }
    }
    const q = mentorSearch.trim().toLowerCase();
    if (
      q &&
      !mt.name.toLowerCase().includes(q) &&
      !mt.major.toLowerCase().includes(q) &&
      !mt.skills.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
  const mentorTierCount = (tier: TeachTier) =>
    mentors.filter((m) => mentorTeachesTier(m, tier)).length;
  const mentorYearCount = (tier: TeachTier, code: string) =>
    mentors.filter((m) => mentorTeachesYear(m, tier, code)).length;
  const pickMentorTier = (tier: TeachTier | "all") => {
    setMentorTier(tier);
    setMentorYear("all");
  };
  // "1AP–5AP" for a multi-year qualification, or just the code for a single year.
  const teachRange = (mt: (typeof mentors)[number], tier: TeachTier) => {
    const codes = mentorYearCodes(mt, tier);
    if (codes.length === 0) return "";
    return codes.length > 1 ? `${codes[0]}–${codes[codes.length - 1]}` : codes[0];
  };

  const courseTitle = (c: AdminCourse) => (c.custom ? c.subject : tr(c.subject, locale));

  const filteredCourses = adminCourses.filter((c) => {
    if (courseTier !== "all" && c.tier !== courseTier) return false;
    if (courseYear !== "all" && c.yearCode !== courseYear) return false;
    if (courseStream !== "all" && c.track !== courseStream) return false;
    const q = courseSearch.trim().toLowerCase();
    if (!q) return true;
    const mentorMatch = c.mentorIds.some((mid) => {
      const m = getMentorById(mid);
      return m ? m.name.toLowerCase().includes(q) : false;
    });
    return courseTitle(c).toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || mentorMatch;
  });
  const courseTierCount = (tier: string) =>
    adminCourses.filter((c) => c.tier === tier).length;
  // Ordered unique year codes for a tier (1AP…5AP, 1AM…4AM, 1AS/2AS/3AS, Licence…).
  const tierYearCodes = (tier: string) => {
    const seen = new Set<string>();
    const out: string[] = [];
    TRACKS.filter((tr2) => tr2.tier === tier).forEach((tr2) => {
      if (!seen.has(tr2.code)) {
        seen.add(tr2.code);
        out.push(tr2.code);
      }
    });
    return out;
  };
  const courseYearCount = (tier: string, code: string) =>
    adminCourses.filter((c) => c.tier === tier && c.yearCode === code).length;
  // High-school streams for a year code (1AS → common cores, 2AS/3AS → streams),
  // in the same order the student-facing courses page lists them.
  const yearStreams = (code: string) =>
    TRACKS.filter((tk) => tk.tier === "High School" && tk.code === code);
  const courseStreamCount = (track: string) =>
    adminCourses.filter((c) => c.track === track).length;
  const pickTier = (tier: string) => {
    setCourseTier(tier);
    setCourseYear("all");
    setCourseStream("all");
  };
  const pickYear = (code: string) => {
    setCourseYear(code);
    setCourseStream("all");
  };

  // ----- Course management actions -----
  const openNewCourse = () => {
    setCform(EMPTY_COURSE);
    setPrimaryMentor(mentors[0].id);
    setCourseEditing("new");
  };
  const openEditCourse = (c: AdminCourse) => {
    setCform({
      subject: c.subject,
      description: c.description,
      major: c.major,
      tier: c.tier,
      track: c.track,
      level: c.level,
      price: c.price,
      priceGroup: c.priceGroup,
      priceIndividual: c.priceIndividual,
      date: c.date,
      time: c.time,
      status: c.status,
      mentorIds: c.mentorIds,
    });
    setCourseEditing(c);
  };
  const saveCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (!cform.subject.trim()) return;
    const editing = courseEditing;
    setCourseEditing(null);
    try {
      if (editing === "new") {
        setAdminCourses(await addAdminCourse({ ...cform, mentorIds: [primaryMentor] }));
        showToast(t("admin.toastAdded"));
      } else if (editing) {
        // Full access: every field is editable (mentors are managed on the card).
        setAdminCourses(await updateAdminCourse(editing.id, cform));
        showToast(t("admin.toastUpdated"));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed");
    }
  };
  const doDelete = async () => {
    if (!courseDelete) return;
    const id = courseDelete.id;
    setCourseDelete(null);
    try {
      setAdminCourses(await deleteAdminCourse(id));
      showToast(t("admin.toastDeleted"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  };
  const doAssign = async (cid: number, mid: number) => {
    try {
      setAdminCourses(await assignMentor(cid, mid));
      showToast(t("admin.toastAssigned"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed");
    }
  };
  const doUnassign = async (cid: number) => {
    try {
      setAdminCourses(await unassignMentor(cid));
      showToast(t("admin.toastUnassigned"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed");
    }
  };

  const filteredStudents = allStudents.filter((s) => {
    if (cycleFilter !== "all" && s.cycle !== cycleFilter) return false;
    if (yearFilter !== "all" && s.year !== yearFilter) return false;
    const q = studentSearch.trim().toLowerCase();
    if (q && !s.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const latestReviews = courses
    .slice(0, 12)
    .flatMap((c) => getReviews(c.id).slice(0, 1).map((r) => ({ r, course: c })))
    .slice(0, 6);

  const gradeOf = (s: StudentRecord) =>
    educationLabel({ cycle: s.cycle, year: s.year, extra: s.extra }, locale);

  // ----- Excel export (CSV with BOM + sep directive so Excel opens it
  // correctly in any locale, Arabic/French text included) -----
  const downloadCsv = (
    filename: string,
    header: string[],
    data: (string | number)[][],
    toastMsg: string
  ) => {
    const esc = (v: string | number) => {
      const str = String(v);
      return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv =
      String.fromCharCode(0xfeff) + // UTF-8 BOM so Excel detects the encoding
      "sep=;\r\n" + // Excel's separator directive (works in every locale)
      [header, ...data].map((r) => r.map(esc).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(/\s+/g, "-").toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
    showToast(toastMsg);
  };

  const exportStudents = (rows: StudentRecord[], scope: string) => {
    downloadCsv(
      `etaalim-students-${scope}.csv`,
      [
        t("admin.thName"),
        t("admin.colEmail"),
        t("admin.colPhone"),
        t("admin.colParentEmail"),
        t("admin.colParentPhone"),
        t("admin.thField"),
        t("admin.thYear"),
        t("admin.thEnrolled"),
        t("admin.dBalance"),
        t("admin.thJoined"),
      ],
      rows.map((s) => [
        s.name,
        s.email,
        s.phone,
        s.parentEmail ?? "",
        s.parentPhone ?? "",
        gradeOf(s),
        s.year,
        s.enrolledCourseIds.length,
        s.balance,
        s.joined.slice(0, 10),
      ]),
      t("admin.toastExported")
    );
  };

  const exportMentors = (rows: typeof mentorRows, scope: string) => {
    downloadCsv(
      `etaalim-mentors-${scope}.csv`,
      [
        t("admin.thMentor"),
        t("admin.colEmail"),
        t("admin.colPhone"),
        t("admin.thField"),
        t("admin.thTeaches"),
        t("admin.colExperience"),
        t("admin.thCourses"),
        t("admin.thStudents"),
        t("admin.thRating"),
      ],
      rows.map(({ mt, courses: cc, students: st, rating }) => [
        mt.name,
        mt.email,
        mt.phone,
        tr(mt.major, locale),
        mt.teaching
          .map((te) => `${t(TIER_KEY[te.tier])} ${teachRange(mt, te.tier)}`)
          .join(" · "),
        mt.experience,
        cc,
        st,
        rating,
      ]),
      t("admin.toastExportedMentors")
    );
  };

  const navCount = (key: Section) =>
    key === "students"
      ? allStudents.length
      : key === "courses"
      ? adminCourses.length
      : key === "mentors"
      ? mentors.length
      : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== Sidebar ===== */}
          <aside className={styles.sidebar}>
            <div className={styles.adminBadge}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="E-Taalim" className={styles.badgeLogo} />
              <b>E-Taalim</b>
              <span>{t("admin.role")}</span>
            </div>
            <nav className={styles.nav}>
              {NAV.map((item) => {
                const c = navCount(item.key);
                return (
                  <button
                    key={item.key}
                    className={`${styles.navItem} ${section === item.key ? styles.navActive : ""}`}
                    onClick={() => setSection(item.key)}
                  >
                    <i className={`fa ${item.icon}`}></i>
                    <span>{t(item.labelKey)}</span>
                    {c > 0 && <span className={styles.navBadge}>{c}</span>}
                  </button>
                );
              })}
            </nav>
            {/* Bottom controls — language, lock, logout */}
            <div className={styles.sideBottom}>
              <div className={styles.langRow}>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    className={`${styles.langBtn} ${locale === l.code ? styles.langActive : ""}`}
                    onClick={() => setLocale(l.code)}
                  >
                    <span>{l.flag}</span> {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                className={styles.lockBtn}
                onClick={() => {
                  lockAdmin();
                  setUnlocked(false);
                }}
              >
                <i className="fa fa-lock"></i> {t("admin.lock")}
              </button>
              <button
                className={styles.logoutBtn}
                onClick={() => {
                  // leave the admin session and return to the public site
                  lockAdmin();
                  router.push("/");
                }}
              >
                <i className="fa fa-sign-out"></i> {t("nav.logout")}
              </button>
            </div>
          </aside>

          {/* ===== Main ===== */}
          <main className={styles.main}>
            {/* -------- Overview -------- */}
            {section === "overview" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("admin.title")}</h1>
                  <p>{t("admin.subtitle")}</p>
                </div>

                <div className={styles.statGrid}>
                  {stats.map((s, i) => (
                    <div
                      key={s.label}
                      className={styles.statCard}
                      style={{ animationDelay: `${100 + i * 70}ms` }}
                    >
                      <span className={styles.statIcon} style={{ color: s.color }}>
                        <i className={`fa ${s.icon}`}></i>
                      </span>
                      <span className={styles.statValue}>{s.value}</span>
                      <span className={styles.statLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <h2 className={styles.blockTitle}>{t("admin.byLevel")}</h2>
                <div className={styles.levelGrid}>
                  {CYCLE_ORDER.map((cy, i) => (
                    <button
                      key={cy}
                      className={styles.levelCard}
                      style={{ animationDelay: `${450 + i * 80}ms` }}
                      onClick={() => {
                        setCycleFilter(cy);
                        setYearFilter("all");
                        setSection("students");
                      }}
                    >
                      <span className={styles.levelCount}>{cycleCount(cy)}</span>
                      <span className={styles.levelName}>{t(CYCLE_KEY[cy])}</span>
                      <span className={styles.levelYears}>
                        {YEARS[cy].map((y) => (
                          <span key={y}>
                            {y} <b>{cycleYearCount(cy, y)}</b>
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>

                <h2 className={styles.blockTitle}>{t("admin.reviewsTitle")}</h2>
                <div className={styles.reviewList}>
                  {latestReviews.map(({ r, course }, i) => (
                    <div
                      key={r.id}
                      className={styles.reviewCard}
                      style={{ animationDelay: `${750 + i * 70}ms` }}
                    >
                      <div className={styles.reviewAvatar}>
                        {r.author.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.reviewBody}>
                        <div className={styles.reviewTop}>
                          {/* reviewer name links to their student profile */}
                          {r.studentId ? (
                            <Link
                              href={`/admin/students/${r.studentId}`}
                              className={styles.reviewAuthor}
                            >
                              {r.author} <i className="fa fa-arrow-right"></i>
                            </Link>
                          ) : (
                            <b>{r.author}</b>
                          )}
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
              </section>
            )}

            {/* -------- Students -------- */}
            {section === "students" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("admin.studentsTitle")}</h1>
                  <p>{t("admin.studentsSub")}</p>
                </div>

                {/* Level filter */}
                <div className={styles.chipRow}>
                  <button
                    className={`${styles.chip} ${cycleFilter === "all" ? styles.chipActive : ""}`}
                    onClick={() => {
                      setCycleFilter("all");
                      setYearFilter("all");
                    }}
                  >
                    {t("admin.allLevels")} <b>{allStudents.length}</b>
                  </button>
                  {CYCLE_ORDER.map((cy) => (
                    <button
                      key={cy}
                      className={`${styles.chip} ${cycleFilter === cy ? styles.chipActive : ""}`}
                      onClick={() => {
                        setCycleFilter(cy);
                        setYearFilter("all");
                      }}
                    >
                      {t(CYCLE_KEY[cy])} <b>{cycleCount(cy)}</b>
                    </button>
                  ))}
                  {/* export everyone, regardless of filters */}
                  <div className={styles.exportGroup}>
                    <button
                      className={styles.exportBtn}
                      onClick={() => exportStudents(allStudents, "all")}
                    >
                      <i className="fa fa-file-excel-o"></i> {t("admin.exportAll")}
                    </button>
                  </div>
                </div>

                {/* Year sub-filter */}
                {cycleFilter !== "all" && (
                  <div className={styles.chipRow}>
                    <button
                      className={`${styles.chipSm} ${yearFilter === "all" ? styles.chipActive : ""}`}
                      onClick={() => setYearFilter("all")}
                    >
                      {t("admin.allYears")}
                    </button>
                    {YEARS[cycleFilter].map((y) => (
                      <button
                        key={y}
                        className={`${styles.chipSm} ${yearFilter === y ? styles.chipActive : ""}`}
                        onClick={() => setYearFilter(y)}
                      >
                        {y} <b>{cycleYearCount(cycleFilter, y)}</b>
                      </button>
                    ))}
                    {/* export the selected level, and — once a year is
                        picked — that single year too */}
                    <div className={styles.exportGroup}>
                      <button
                        className={styles.exportBtn}
                        onClick={() =>
                          exportStudents(
                            allStudents.filter((s) => s.cycle === cycleFilter),
                            cycleFilter
                          )
                        }
                      >
                        <i className="fa fa-file-excel-o"></i>{" "}
                        {t("admin.exportLevel", { level: t(CYCLE_KEY[cycleFilter]) })}
                      </button>
                      {yearFilter !== "all" && (
                        <button
                          className={styles.exportBtn}
                          onClick={() =>
                            exportStudents(
                              allStudents.filter(
                                (s) => s.cycle === cycleFilter && s.year === yearFilter
                              ),
                              `${cycleFilter}-${yearFilter}`
                            )
                          }
                        >
                          <i className="fa fa-file-excel-o"></i>{" "}
                          {t("admin.exportYear", { year: yearFilter })}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className={styles.searchBar}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={t("admin.searchStudents")}
                  />
                </div>

                {filteredStudents.length === 0 ? (
                  <p className={styles.muted}>{t("admin.noStudents")}</p>
                ) : (
                  <div className={`${styles.tableWrap} ${styles.scrollTable}`}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>{t("admin.thName")}</th>
                          <th>{t("admin.thField")}</th>
                          <th>{t("admin.thYear")}</th>
                          <th>{t("admin.thEnrolled")}</th>
                          <th>{t("admin.thJoined")}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className={styles.clickRow} onClick={() => setActive(s)}>
                            <td>
                              <div className={styles.mentorCell}>
                                <span className={styles.miniAvatar}>{s.initials}</span>
                                <span>{s.name}</span>
                                {s.registered && (
                                  <span className={`${styles.badge} ${styles.bAvail}`}>
                                    {t("admin.regBadge")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{gradeOf(s)}</td>
                            <td>{s.year}</td>
                            <td>{s.enrolledCourseIds.length}</td>
                            <td>{formatDate(s.joined.slice(0, 10), locale)}</td>
                            <td>
                              {/* full profile page (row click keeps the quick modal) */}
                              <Link
                                href={`/admin/students/${s.id}`}
                                className={styles.viewLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t("admin.view")} <i className="fa fa-arrow-right"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* -------- Courses (managed) -------- */}
            {section === "courses" && (
              <section>
                <div className={styles.headRow}>
                  <div className={styles.panelHead} style={{ marginBottom: 0 }}>
                    <h1>{t("admin.coursesTitle")}</h1>
                    <p>{t("admin.coursesSub")}</p>
                  </div>
                  <button className={styles.addBtn} onClick={openNewCourse}>
                    <i className="fa fa-plus"></i> {t("admin.addCourse")}
                  </button>
                </div>

                {/* Level filter */}
                <div className={styles.chipRow}>
                  <button
                    className={`${styles.chip} ${courseTier === "all" ? styles.chipActive : ""}`}
                    onClick={() => pickTier("all")}
                  >
                    {t("admin.allLevels")} <b>{adminCourses.length}</b>
                  </button>
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      className={`${styles.chip} ${courseTier === tier ? styles.chipActive : ""}`}
                      onClick={() => pickTier(tier)}
                    >
                      {t(TIER_KEY[tier])} <b>{courseTierCount(tier)}</b>
                    </button>
                  ))}
                </div>

                {/* Year sub-filter (within the selected level) */}
                {courseTier !== "all" && tierYearCodes(courseTier).length > 0 && (
                  <div className={styles.chipRow}>
                    <button
                      className={`${styles.chipSm} ${courseYear === "all" ? styles.chipActive : ""}`}
                      onClick={() => pickYear("all")}
                    >
                      {t("admin.allYears")}
                    </button>
                    {tierYearCodes(courseTier).map((code) => (
                      <button
                        key={code}
                        className={`${styles.chipSm} ${courseYear === code ? styles.chipActive : ""}`}
                        onClick={() => pickYear(code)}
                      >
                        {code} <b>{courseYearCount(courseTier, code)}</b>
                      </button>
                    ))}
                  </div>
                )}

                {/* Stream sub-filter — high school only: each year is divided
                    (1AS → Science/Letters common cores, 2AS & 3AS → streams),
                    same division students see on the courses page */}
                {courseTier === "High School" &&
                  courseYear !== "all" &&
                  yearStreams(courseYear).length > 0 && (
                    <div className={styles.chipRow}>
                      <button
                        className={`${styles.chipSm} ${courseStream === "all" ? styles.chipActive : ""}`}
                        onClick={() => setCourseStream("all")}
                      >
                        {t("admin.allStreams")}
                      </button>
                      {yearStreams(courseYear).map((tk) => (
                        <button
                          key={tk.key}
                          className={`${styles.chipSm} ${courseStream === tk.key ? styles.chipActive : ""}`}
                          onClick={() => setCourseStream(tk.key)}
                        >
                          {t(`coursesPage.tracks.${tk.key}`)} <b>{courseStreamCount(tk.key)}</b>
                        </button>
                      ))}
                    </div>
                  )}

                <div className={styles.searchBar}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder={t("admin.searchCourses")}
                  />
                </div>
                {filteredCourses.length === 0 ? (
                  <p className={styles.muted}>{t("admin.noCourses")}</p>
                ) : (
                  <div className={styles.courseGrid}>
                    {filteredCourses.map((c, i) => {
                      const available = mentors.filter((m) => !c.mentorIds.includes(m.id));
                      const exam =
                        c.yearCode === "4AM" ? "BEM" : c.yearCode === "3AS" ? "BAC" : null;
                      return (
                        <div
                          key={c.id}
                          className={styles.cCard}
                          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                        >
                          {/* Banner — identical layer stack to the public courses page */}
                          <div className={styles.cThumb}>
                            <CourseBanner subject={c.major} seed={c.id} />
                            <div className={styles.cChipRow}>
                              <span
                                className={styles.cChip}
                                style={cssVars(categoryAccent(c.major))}
                              >
                                {tr(c.major, locale)}
                              </span>
                              {exam && (
                                <span className={styles.cExam}>
                                  {t(`coursesPage.exam${exam}`)}
                                </span>
                              )}
                            </div>
                            <span
                              className={`${styles.cStatus} ${c.status === "available" ? styles.bAvail : styles.bUpcoming}`}
                            >
                              {c.status === "available"
                                ? t("admin.statusAvailable")
                                : t("admin.statusUpcoming")}
                            </span>
                            <span className={styles.cPrice}>
                              {t("coursesPage.from")} {money(c.price)}
                            </span>
                          </div>

                          <div className={styles.cBody}>
                            <span className={styles.cTier}>
                              <i className={`fa ${TIER_ICONS[c.tier] ?? "fa-book"}`}></i>
                              {c.yearCode || tr(c.tier, locale)}
                            </span>
                            <h3>{courseTitle(c)}</h3>
                            {c.description && (
                              <p className={styles.cDesc}>{c.description}</p>
                            )}

                            {/* Mentors delivering this course */}
                            <div className={styles.mentorAssign}>
                              <span className={styles.mentorAssignLabel}>{t("admin.mentorsLabel")}</span>
                              <div className={styles.mentorChips}>
                                {c.mentorIds.length === 0 && (
                                  <span className={styles.noMentor}>{t("admin.noMentor")}</span>
                                )}
                                {c.mentorIds.map((mid) => {
                                  const m = getMentorById(mid);
                                  if (!m) return null;
                                  return (
                                    <span key={mid} className={styles.mentorChip}>
                                      <img src={m.profilePicture} alt={m.name} />
                                      {mentorDisplayName(m, locale)}
                                      <button
                                        type="button"
                                        onClick={() => doUnassign(c.id)}
                                        aria-label={t("admin.toastUnassigned")}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })}
                                {available.length > 0 && (
                                  <select
                                    className={styles.addMentorSel}
                                    value=""
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value, 10);
                                      if (v) doAssign(c.id, v);
                                    }}
                                  >
                                    <option value="">+ {t("admin.addMentor")}</option>
                                    {available.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>

                            <div className={styles.cMeta}>
                              <span>
                                <i className="fa fa-signal"></i>
                                {tr(c.level, locale)}
                              </span>
                              {c.track && (
                                <span>
                                  <i className="fa fa-layer-group"></i>
                                  {t(`coursesPage.tracks.${c.track}`)}
                                </span>
                              )}
                              <span>
                                <i className="fa fa-users"></i>
                                {enrolledByCourse.get(c.id) ?? 0} {t("admin.studentsWord")}
                              </span>
                              {c.date && (
                                <span>
                                  <i className="fa fa-calendar"></i>
                                  {formatDate(c.date, locale)}
                                </span>
                              )}
                            </div>

                            <div className={styles.cActions}>
                              <button className={styles.editBtn} onClick={() => openEditCourse(c)}>
                                <i className="fa fa-pencil"></i> {t("admin.edit")}
                              </button>
                              <button className={styles.delBtn} onClick={() => setCourseDelete(c)} aria-label={t("admin.del")}>
                                <i className="fa fa-trash"></i>
                              </button>
                              {!c.custom && (
                                <Link href={`/admin/courses/${c.id}`} className={styles.viewLink}>
                                  {t("admin.view")} <i className="fa fa-arrow-right"></i>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* -------- Mentors -------- */}
            {section === "mentors" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("admin.mentorsTitle")}</h1>
                  <p>{t("admin.mentorsSub")}</p>
                </div>

                {/* Level filter */}
                <div className={styles.chipRow}>
                  <button
                    className={`${styles.chip} ${mentorTier === "all" ? styles.chipActive : ""}`}
                    onClick={() => pickMentorTier("all")}
                  >
                    {t("admin.allLevels")} <b>{mentors.length}</b>
                  </button>
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      className={`${styles.chip} ${mentorTier === tier ? styles.chipActive : ""}`}
                      onClick={() => pickMentorTier(tier)}
                    >
                      {t(TIER_KEY[tier])} <b>{mentorTierCount(tier)}</b>
                    </button>
                  ))}
                  {/* export every mentor, regardless of filters */}
                  <div className={styles.exportGroup}>
                    <button
                      className={styles.exportBtn}
                      onClick={() => exportMentors(mentorRows, "all")}
                    >
                      <i className="fa fa-file-excel-o"></i> {t("admin.exportAll")}
                    </button>
                  </div>
                </div>

                {/* Year sub-filter — mentors qualified for an older year also
                    show under every younger one (5AP teacher → 1AP…5AP). */}
                {mentorTier !== "all" && (
                  <div className={styles.chipRow}>
                    <button
                      className={`${styles.chipSm} ${mentorYear === "all" ? styles.chipActive : ""}`}
                      onClick={() => setMentorYear("all")}
                    >
                      {t("admin.allYears")}
                    </button>
                    {TEACH_YEARS[mentorTier].map((code) => (
                      <button
                        key={code}
                        className={`${styles.chipSm} ${mentorYear === code ? styles.chipActive : ""}`}
                        onClick={() => setMentorYear(code)}
                      >
                        {code} <b>{mentorYearCount(mentorTier, code)}</b>
                      </button>
                    ))}
                    {/* export the selected level, and — once a year is
                        picked — the mentors covering that year too */}
                    <div className={styles.exportGroup}>
                      <button
                        className={styles.exportBtn}
                        onClick={() =>
                          exportMentors(
                            mentorRows.filter(({ mt }) => mentorTeachesTier(mt, mentorTier)),
                            mentorTier
                          )
                        }
                      >
                        <i className="fa fa-file-excel-o"></i>{" "}
                        {t("admin.exportLevel", { level: t(TIER_KEY[mentorTier]) })}
                      </button>
                      {mentorYear !== "all" && (
                        <button
                          className={styles.exportBtn}
                          onClick={() =>
                            exportMentors(
                              mentorRows.filter(({ mt }) =>
                                mentorTeachesYear(mt, mentorTier, mentorYear)
                              ),
                              `${mentorTier}-${mentorYear}`
                            )
                          }
                        >
                          <i className="fa fa-file-excel-o"></i>{" "}
                          {t("admin.exportYear", { year: mentorYear })}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className={styles.searchBar}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder={t("admin.searchMentors")}
                  />
                </div>

                {filteredMentorRows.length === 0 ? (
                  <p className={styles.muted}>{t("admin.noMentors")}</p>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>{t("admin.thMentor")}</th>
                          <th>{t("admin.thField")}</th>
                          <th>{t("admin.thTeaches")}</th>
                          <th>{t("admin.thCourses")}</th>
                          <th>{t("admin.thStudents")}</th>
                          <th>{t("admin.thRating")}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMentorRows.map(({ mt, courses: cc, students: st, rating }) => (
                          <tr key={mt.id}>
                            <td>
                              <div className={styles.mentorCell}>
                                <img src={mt.profilePicture} alt={mt.name} />
                                <span>{mentorDisplayName(mt, locale)}</span>
                              </div>
                            </td>
                            <td>{tr(mt.major, locale)}</td>
                            <td>
                              <div className={styles.teachChips}>
                                {mt.teaching.map((te) => (
                                  <span
                                    key={te.tier}
                                    className={`${styles.teachChip} ${
                                      mentorTier === te.tier ? styles.teachChipOn : ""
                                    }`}
                                  >
                                    {t(TIER_KEY[te.tier])} <b>{teachRange(mt, te.tier)}</b>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>{cc}</td>
                            <td>{st}</td>
                            <td>
                              <span className={styles.rating}>
                                <i className="fa fa-star"></i> {rating}
                              </span>
                            </td>
                            <td>
                              {/* full public profile, exactly as students see it */}
                              <Link href={`/admin/mentors/${mt.id}`} className={styles.viewLink}>
                                {t("admin.view")} <i className="fa fa-arrow-right"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ===== Student detail ===== */}
      {active && (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.detailClose}
              onClick={() => setActive(null)}
              aria-label={t("admin.dClose")}
            >
              <i className="fa fa-times"></i>
            </button>

            <div className={styles.detailHead}>
              <span className={styles.detailAvatar}>{active.initials}</span>
              <div>
                <b>{active.name}</b>
                <span className={styles.detailGrade}>{gradeOf(active)}</span>
              </div>
            </div>

            {/* Contact */}
            <div className={styles.detailContact}>
              <a href={`mailto:${active.email}`} className={styles.contactRow}>
                <i className="fa fa-envelope"></i> {active.email}
              </a>
              <span className={styles.contactRow}>
                <i className="fa fa-phone"></i> {active.phone}
              </span>
              {/* parent/guardian contact — captured at signup for minors */}
              {active.parentEmail && (
                <a href={`mailto:${active.parentEmail}`} className={styles.contactRow}>
                  <i className="fa fa-shield"></i> {t("admin.dParent")} · {active.parentEmail}
                </a>
              )}
              {active.parentPhone && (
                <span className={styles.contactRow}>
                  <i className="fa fa-mobile"></i> {t("admin.dParent")} · {active.parentPhone}
                </span>
              )}
              <a href={`mailto:${active.email}`} className={styles.emailBtn}>
                <i className="fa fa-paper-plane"></i> {t("admin.dSendEmail")}
              </a>
            </div>

            <div className={styles.detailMeta}>
              <div>
                <span className={styles.metaLabel}>{t("admin.dBalance")}</span>
                <span className={styles.metaValue}>{money(active.balance)}</span>
              </div>
              <div>
                <span className={styles.metaLabel}>{t("admin.dJoined")}</span>
                <span className={styles.metaValue}>
                  {formatDate(active.joined.slice(0, 10), locale)}
                </span>
              </div>
            </div>

            {/* Enrolled courses */}
            <h4 className={styles.detailSection}>
              {t("admin.dEnrolled")} ({active.enrolledCourseIds.length})
            </h4>
            {active.enrolledCourseIds.length === 0 ? (
              <p className={styles.muted}>{t("admin.dNoEnrolled")}</p>
            ) : (
              <div className={styles.detailList}>
                {active.enrolledCourseIds.map((cid) => {
                  const c = getCourseById(cid);
                  if (!c) return null;
                  const mentor = getMentorById(c.mentorId);
                  return (
                    <div key={cid} className={styles.detailCourse}>
                      <div>
                        <b>{tr(c.subject, locale)}</b>
                        <span>{mentor ? mentorDisplayName(mentor, locale) : ""}</span>
                      </div>
                      <span className={styles.price}>{money(c.price)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Transactions */}
            <h4 className={styles.detailSection}>{t("admin.dTransactions")}</h4>
            <div className={styles.detailList}>
              {active.transactions.map((tx) => (
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
          </div>
        </div>
      )}

      {/* ===== Course editor ===== */}
      {courseEditing && (
        <div className={styles.overlay} onClick={() => setCourseEditing(null)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formHead}>
              <h3>{courseEditing === "new" ? t("admin.newCourse") : t("admin.editCourse")}</h3>
              <button className={styles.detailClose} onClick={() => setCourseEditing(null)} aria-label={t("admin.cancel")}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form className={styles.formBody} onSubmit={saveCourse}>
              <label className={styles.field}>
                <span>{t("admin.fSubject")}</span>
                <input
                  type="text"
                  value={cform.subject}
                  onChange={(e) => setCform({ ...cform, subject: e.target.value })}
                  placeholder={t("admin.fSubjectPh")}
                  required
                />
              </label>
              <label className={styles.field}>
                <span>{t("admin.fDescription")}</span>
                <textarea
                  rows={4}
                  value={cform.description}
                  onChange={(e) => setCform({ ...cform, description: e.target.value })}
                  placeholder={t("admin.fDescriptionPh")}
                />
              </label>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t("admin.fMajor")}</span>
                  <input
                    type="text"
                    value={cform.major}
                    onChange={(e) => setCform({ ...cform, major: e.target.value })}
                  />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t("admin.fTier")}</span>
                  <select
                    value={cform.tier}
                    onChange={(e) =>
                      // changing cycle resets the year/stream — tracks differ per cycle
                      setCform({ ...cform, tier: e.target.value, track: "" })
                    }
                  >
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tr(tier, locale)}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>{t("admin.fYear")}</span>
                  {/* year + stream in one pick — high school lists every
                      stream of every year, exactly as students browse them */}
                  <select
                    value={cform.track}
                    onChange={(e) => setCform({ ...cform, track: e.target.value })}
                  >
                    <option value="">{t("admin.fYearNone")}</option>
                    {TRACKS.filter((tk) => tk.tier === cform.tier).map((tk) => (
                      <option key={tk.key} value={tk.key}>
                        {tk.code} · {t(`coursesPage.tracks.${tk.key}`)}
                        {tk.exam ? ` (${tk.exam})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t("admin.fPrice")}</span>
                  <input
                    type="number"
                    value={cform.price}
                    onChange={(e) => setCform({ ...cform, price: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
                <label className={styles.field}>
                  <span>{t("admin.fPriceGroup")}</span>
                  <input
                    type="number"
                    value={cform.priceGroup}
                    onChange={(e) => setCform({ ...cform, priceGroup: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
                <label className={styles.field}>
                  <span>{t("admin.fPriceIndividual")}</span>
                  <input
                    type="number"
                    value={cform.priceIndividual}
                    onChange={(e) => setCform({ ...cform, priceIndividual: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t("admin.fDate")}</span>
                  <input
                    type="date"
                    value={cform.date}
                    onChange={(e) => setCform({ ...cform, date: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>{t("admin.fTime")}</span>
                  <input
                    type="time"
                    value={cform.time}
                    onChange={(e) => setCform({ ...cform, time: e.target.value })}
                  />
                </label>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t("admin.fStatus")}</span>
                  <select
                    value={cform.status}
                    onChange={(e) => setCform({ ...cform, status: e.target.value as AdminCourseInput["status"] })}
                  >
                    <option value="available">{t("admin.statusAvailable")}</option>
                    <option value="upcoming">{t("admin.statusUpcoming")}</option>
                  </select>
                </label>
                {courseEditing === "new" && (
                  <label className={styles.field}>
                    <span>{t("admin.fPrimaryMentor")}</span>
                    <select value={primaryMentor} onChange={(e) => setPrimaryMentor(parseInt(e.target.value, 10))}>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {courseEditing === "new" && <p className={styles.formHint}>{t("admin.mentorsHint")}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.ghostBtn} onClick={() => setCourseEditing(null)}>
                  {t("admin.cancel")}
                </button>
                <button type="submit" className={styles.primaryBtn}>{t("admin.save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete confirm ===== */}
      {courseDelete && (
        <div className={styles.overlay} onClick={() => setCourseDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <i className="fa fa-trash"></i>
            </div>
            <h3>{t("admin.delTitle")}</h3>
            <p>{t("admin.delText", { subject: courseTitle(courseDelete) })}</p>
            <div className={styles.formActions}>
              <button className={styles.ghostBtn} onClick={() => setCourseDelete(null)}>{t("admin.cancel")}</button>
              <button className={styles.dangerBtn} onClick={doDelete}>{t("admin.delYes")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast}>
          <i className="fa fa-check-circle"></i> {toast}
        </div>
      )}
    </div>
  );
}
