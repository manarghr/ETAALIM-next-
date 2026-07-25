"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import CourseBanner from "@/components/CourseBanner";
import TopUpModal from "@/components/TopUpModal";
import { useI18n } from "@/i18n/I18nProvider";
import { tr, mentorDisplayName } from "@/data/localized";
import {
  courses,
  getCourseById,
  getJoinOption,
  formatDZD,
  formatDate,
  localeTag,
  Course,
} from "@/data/courses";
import { getMentorById } from "@/data/mentors";
import { educationLabel, Cycle } from "@/data/education";
import { getLessons } from "@/data/lessons";
import { progressPct } from "@/lib/progress";
import FavoriteButton from "@/components/FavoriteButton";
import {
  getStudent,
  isMinor,
  addFunds,
  chargeWallet,
  toggleFollow,
  Student,
} from "@/lib/student";
import { getEnrollments, addEnrollment, Enrollment } from "@/lib/enrollment";
import { getReceipts, Receipt } from "@/lib/receipts";
import { getBalance, topUp } from "@/lib/wallet";
import {
  getConsentRequests,
  createConsentRequest,
  setConsentStatus,
} from "@/lib/consent";
import { sessionDateFor, countdownOf, isSoon, DISCOUNTS } from "@/lib/schedule";
import ChatDock from "@/components/ChatDock";
import styles from "./dashboard.module.css";

type Mentor = NonNullable<ReturnType<typeof getMentorById>>;
type Section =
  | "overview"
  | "courses"
  | "saved"
  | "mentors"
  | "calendar"
  | "wallet"
  | "receipts"
  | "notifications";

const NAV: { key: Section; labelKey: string; icon: string }[] = [
  { key: "overview", labelKey: "dash.navOverview", icon: "fa-th-large" },
  { key: "courses", labelKey: "dash.navCourses", icon: "fa-book" },
  { key: "saved", labelKey: "dash.navSaved", icon: "fa-star" },
  { key: "mentors", labelKey: "dash.navMentors", icon: "fa-users" },
  { key: "calendar", labelKey: "dash.navSchedule", icon: "fa-calendar" },
  { key: "wallet", labelKey: "dash.navWallet", icon: "fa-money" },
  { key: "receipts", labelKey: "dash.navReceipts", icon: "fa-file-text-o" },
  { key: "notifications", labelKey: "dash.navNotifications", icon: "fa-bell" },
];

const MODE_KEY: Record<string, string> = {
  recorded: "dash.modeRecorded",
  group: "dash.modeGroup",
  individual: "dash.modeIndividual",
};

const TOPUP_AMOUNTS = [1000, 2000, 5000];

export default function DashboardClient() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [section, setSection] = useState<Section>("overview");
  const [base] = useState(() => Date.now());

  const [buyTarget, setBuyTarget] = useState<Course | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  // Docked chat: which mentor's conversation is open, and whether it's collapsed.
  const [chatMentor, setChatMentor] = useState<number | null>(null);
  const [chatMin, setChatMin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [balance, setBalance] = useState<number | null>(null);

  // Load the purchase history from Supabase whenever the Receipts tab opens.
  useEffect(() => {
    if (section === "receipts") {
      getReceipts().then(setReceipts);
    }
  }, [section]);

  // Keep the real wallet balance fresh as the user navigates the dashboard.
  // Ignore null (a transient auth miss) so it never wipes a loaded value.
  useEffect(() => {
    getBalance().then((b) => {
      if (b !== null) setBalance(b);
    });
  }, [section]);

  useEffect(() => {
    // Gate: the dashboard is only for signed-in users.
    if (!getSession()) {
      router.replace("/login");
      return;
    }
    // seed a few enrollments so the dashboard has content on first visit
    if (getEnrollments().length === 0) {
      [1, 2, 4].forEach((id) =>
        addEnrollment({
          courseId: id,
          mode: "recorded",
          ref: "SEED-" + id,
          date: new Date().toISOString(),
        })
      );
    }
    setMounted(true);
  }, [router]);

  const reload = () => setTick((n) => n + 1);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  // "in 10 minutes" / "خلال 10 دقائق" — the phrase lives in the dictionary.
  const cd = (date: Date) => {
    const { key, n } = countdownOf(date, base);
    return t(key, { n });
  };
  const money = (amount: number) => formatDZD(amount, locale);
  const mentorName = (id: number) => {
    const m = getMentorById(id);
    return m ? mentorDisplayName(m, locale) : "";
  };
  // New signups carry structured education; older/demo records fall back to
  // the legacy `grade` string.
  const gradeLabel = (s: Student) =>
    s.educationCycle
      ? educationLabel(
          {
            cycle: s.educationCycle as Cycle,
            year: s.educationYear ?? "",
            extra: s.educationExtra ?? "",
          },
          locale
        )
      : tr(s.grade, locale);

  // ----- derived state (re-read on every render; cheap) -----
  void tick;
  const student = getStudent();
  const enrollments = getEnrollments();
  const consent = getConsentRequests();

  const enrolledCourses = enrollments
    .map((e) => ({ e, course: getCourseById(e.courseId) }))
    .filter((x): x is { e: Enrollment; course: Course } => Boolean(x.course));

  const sessions = enrolledCourses
    .map((x, i) => ({ ...x, date: sessionDateFor(i, base) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const followedMentors = student.followedMentorIds
    .map((id) => getMentorById(id))
    .filter((m): m is Mentor => Boolean(m));

  const recommended = courses
    .filter((c) => !enrollments.some((e) => e.courseId === c.id))
    .filter((c) => c.tier === "High School")
    .slice(0, 4);

  const savedCourses = student.favoriteCourseIds
    .map((id) => getCourseById(id))
    .filter((c): c is Course => Boolean(c));

  const pendingConsent = consent.filter((c) => c.status === "pending");

  const notifications = [
    ...sessions
      .filter((s) => isSoon(s.date, base))
      .map((s) => ({
        id: "s" + s.course.id,
        icon: "fa-clock-o",
        accent: "#534ab7",
        title: t("dash.notifStarts", {
          subject: tr(s.course.subject, locale),
          when: cd(s.date),
        }),
        text: t("dash.notifWith", { mentor: mentorName(s.course.mentorId) }),
        tag: "",
      })),
    ...pendingConsent.map((c) => ({
      id: "c" + c.id,
      icon: "fa-shield",
      accent: "#e0894a",
      title: t("dash.notifConsentTitle"),
      text: t("dash.notifConsentText", {
        course: tr(c.courseName, locale),
        amount: money(c.amount),
        email: c.parentEmail,
      }),
      tag: "",
    })),
    ...DISCOUNTS.map((d) => ({
      id: "d" + d.id,
      icon: "fa-tag",
      accent: d.accent,
      title: t(d.titleKey),
      text: t(d.textKey),
      tag: d.tag,
    })),
  ];

  const nextSession = sessions[0];

  // Real lesson-completion progress (0 until the student starts a course).
  const progressFor = (c: Course) =>
    progressPct(c.id, getLessons(c.id, c.major).length);

  const priceOf = (c: Course) => getJoinOption(c, "recorded").price;

  // ----- actions -----
  const confirmBuy = () => {
    const c = buyTarget;
    if (!c) return;
    const price = priceOf(c);
    if (student.balance < price) {
      setBuyTarget(null);
      showToast(t("dash.toastInsufficient"));
      return;
    }
    if (isMinor(student)) {
      createConsentRequest({
        courseId: c.id,
        courseName: c.subject,
        amount: price,
        mode: "recorded",
        parentEmail: student.parentEmail,
      });
      setBuyTarget(null);
      reload();
      showToast(t("dash.toastApprovalSent", { email: student.parentEmail }));
      return;
    }
    chargeWallet(price, c.subject);
    addEnrollment({
      courseId: c.id,
      mode: "recorded",
      ref: "WAL-" + c.id,
      date: new Date().toISOString(),
    });
    setBuyTarget(null);
    reload();
    showToast(t("dash.toastEnrolled", { course: tr(c.subject, locale) }));
  };

  const approveConsent = (reqId: string) => {
    const req = consent.find((r) => r.id === reqId);
    if (!req) return;
    if (!chargeWallet(req.amount, req.courseName)) {
      showToast(t("dash.toastInsufficientApprove"));
      return;
    }
    addEnrollment({
      courseId: req.courseId,
      mode: req.mode,
      ref: "WAL-" + req.courseId,
      date: new Date().toISOString(),
    });
    setConsentStatus(reqId, "approved");
    reload();
    showToast(t("dash.toastApproved"));
  };

  const denyConsent = (reqId: string) => {
    setConsentStatus(reqId, "denied");
    reload();
    showToast(t("dash.toastDenied"));
  };

  // Called by TopUpModal after the (mock) payment succeeds — the wallet is
  // only credited once the user has gone through the payment form.
  const completeTopUp = async (amount: number) => {
    setTopUpAmount(null);
    try {
      const newBalance = await topUp(amount); // real: adds money + logs it
      setBalance(newBalance); // update the displayed balance right away
      addFunds(amount); // TEMP: keep the old localStorage wallet in sync
      reload();
      showToast(t("dash.toastToppedUp", { amount: money(amount) }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Top-up failed");
    }
  };

  const follow = (id: number) => {
    toggleFollow(id);
    reload();
  };

  // Open (or re-focus) a mentor's docked chat, expanded.
  const openChat = (id: number) => {
    setChatMentor(id);
    setChatMin(false);
  };

  if (!mounted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.skeleton}>{t("dash.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* ===== Sidebar ===== */}
          <aside className={styles.sidebar}>
            <div className={styles.profile}>
              <div className={styles.avatar}>{student.initials}</div>
              <div className={styles.pName}>{student.name}</div>
              <div className={styles.pGrade}>{gradeLabel(student)}</div>
            </div>

            <div className={styles.walletMini}>
              <span className={styles.wmLabel}>{t("dash.walletBalance")}</span>
              <span className={styles.wmValue}>{money(balance ?? student.balance)}</span>
            </div>

            <nav className={styles.nav}>
              {NAV.map((item) => {
                const count =
                  item.key === "notifications"
                    ? notifications.length
                    : item.key === "courses"
                    ? enrolledCourses.length
                    : item.key === "saved"
                    ? savedCourses.length
                    : 0;
                return (
                  <button
                    key={item.key}
                    className={`${styles.navItem} ${
                      section === item.key ? styles.navActive : ""
                    }`}
                    onClick={() => setSection(item.key)}
                  >
                    <i className={`fa ${item.icon}`}></i>
                    <span>{t(item.labelKey)}</span>
                    {count > 0 && <span className={styles.navBadge}>{count}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ===== Main ===== */}
          <main className={styles.main}>
            {/* -------- Overview -------- */}
            {section === "overview" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>
                    {t("dash.welcome", { name: student.name.split(" ")[0] })}
                  </h1>
                  <p>{t("dash.welcomeSub")}</p>
                </div>

                <div className={styles.statGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-book"></i>
                    </span>
                    <span className={styles.statValue}>{enrolledCourses.length}</span>
                    <span className={styles.statLabel}>{t("dash.statCourses")}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#1d9e75" }}>
                      <i className="fa fa-users"></i>
                    </span>
                    <span className={styles.statValue}>{followedMentors.length}</span>
                    <span className={styles.statLabel}>{t("dash.statMentors")}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#e0894a" }}>
                      <i className="fa fa-money"></i>
                    </span>
                    <span className={styles.statValue}>{money(balance ?? student.balance)}</span>
                    <span className={styles.statLabel}>{t("dash.walletBalance")}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-bell"></i>
                    </span>
                    <span className={styles.statValue}>{notifications.length}</span>
                    <span className={styles.statLabel}>
                      {t("dash.statNotifications")}
                    </span>
                  </div>
                </div>

                {nextSession && (
                  <div className={styles.nextCard}>
                    <div className={styles.nextLeft}>
                      <span className={styles.nextEyebrow}>
                        <i className="fa fa-clock-o"></i> {t("dash.nextSession")}
                      </span>
                      <h3>{tr(nextSession.course.subject, locale)}</h3>
                      <p>
                        {t("dash.nextWith", {
                          mentor: mentorName(nextSession.course.mentorId),
                          date: formatDate(
                            nextSession.date.toISOString().slice(0, 10),
                            locale
                          ),
                        })}
                      </p>
                    </div>
                    <div className={styles.nextCountdown}>{cd(nextSession.date)}</div>
                  </div>
                )}

                {pendingConsent.length > 0 && (
                  <div className={styles.consentPanel}>
                    <h3 className={styles.blockTitle}>
                      <i className="fa fa-shield"></i> {t("dash.approvalsTitle")}
                    </h3>
                    {pendingConsent.map((c) => (
                      <div key={c.id} className={styles.consentItem}>
                        <div>
                          <b>{tr(c.courseName, locale)}</b> · {money(c.amount)}
                          <div className={styles.consentMeta}>
                            {t("dash.approvalsMeta", { email: c.parentEmail })}
                          </div>
                        </div>
                        <div className={styles.consentActions}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => approveConsent(c.id)}
                          >
                            {t("dash.approve")}
                          </button>
                          <button
                            className={styles.denyBtn}
                            onClick={() => denyConsent(c.id)}
                          >
                            {t("dash.deny")}
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className={styles.simNote}>{t("dash.simNote")}</p>
                  </div>
                )}

                <h3 className={styles.blockTitle}>{t("dash.recommended")}</h3>
                <div className={styles.recoGrid}>
                  {recommended.map((c) => (
                    <div key={c.id} className={styles.recoCard}>
                      <div className={styles.recoThumb}>
                        <CourseBanner subject={c.major} seed={c.id} />
                        <div className={styles.favCorner}>
                          <FavoriteButton courseId={c.id} onChange={reload} />
                        </div>
                      </div>
                      <div className={styles.recoBody}>
                        <b>{tr(c.subject, locale)}</b>
                        <span className={styles.recoMeta}>
                          {mentorName(c.mentorId)}
                        </span>
                        <div className={styles.recoFoot}>
                          <span className={styles.recoPrice}>{money(priceOf(c))}</span>
                          <Link href={`/courses/${c.id}`} className={styles.recoLink}>
                            {t("dash.view")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* -------- My Courses -------- */}
            {section === "courses" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.navCourses")}</h1>
                  <p>{t("dash.coursesSub", { n: enrolledCourses.length })}</p>
                </div>
                {enrolledCourses.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-book"></i>
                    <p>{t("dash.coursesEmpty")}</p>
                    <Link href="/courses" className={styles.primaryBtn}>
                      {t("dash.browseCourses")}
                    </Link>
                  </div>
                ) : (
                  <div className={styles.courseList}>
                    {sessions.map(({ course, e, date }) => (
                      <div key={course.id} className={styles.courseItem}>
                        <div className={styles.ciThumb}>
                          <CourseBanner subject={course.major} seed={course.id} />
                        </div>
                        <div className={styles.ciInfo}>
                          <div className={styles.ciTop}>
                            <b>{tr(course.subject, locale)}</b>
                            <span className={styles.ciMode}>
                              {t(MODE_KEY[e.mode] ?? "dash.modeRecorded")}
                            </span>
                          </div>
                          <span className={styles.ciMentor}>
                            {mentorName(course.mentorId)} · {tr(course.tier, locale)}
                          </span>
                          <div className={styles.progressRow}>
                            <div className={styles.progressTrack}>
                              <span
                                className={styles.progressBar}
                                style={{ width: `${progressFor(course)}%` }}
                              ></span>
                            </div>
                            <span className={styles.progressPct}>
                              {progressFor(course)}%
                            </span>
                          </div>
                          <span className={styles.ciNext}>
                            <i className="fa fa-clock-o"></i>{" "}
                            {t("dash.nextSessionIn", { when: cd(date) })}
                          </span>
                        </div>
                        <Link
                          href={`/courses/${course.id}#learn`}
                          className={styles.continueBtn}
                        >
                          {t("dash.continue")} <i className="fa fa-play"></i>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Saved / favorites -------- */}
            {section === "saved" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.savedTitle")}</h1>
                  <p>{t("dash.savedSub")}</p>
                </div>
                {savedCourses.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-star-o"></i>
                    <p>{t("dash.savedEmpty")}</p>
                    <Link href="/courses" className={styles.primaryBtn}>
                      {t("dash.browseCourses")}
                    </Link>
                  </div>
                ) : (
                  <div className={styles.recoGrid}>
                    {savedCourses.map((c) => (
                      <div key={c.id} className={styles.recoCard}>
                        <div className={styles.recoThumb}>
                          <CourseBanner subject={c.major} seed={c.id} />
                          <div className={styles.favCorner}>
                            <FavoriteButton courseId={c.id} onChange={reload} />
                          </div>
                        </div>
                        <div className={styles.recoBody}>
                          <b>{tr(c.subject, locale)}</b>
                          <span className={styles.recoMeta}>
                            {mentorName(c.mentorId)}
                          </span>
                          <div className={styles.recoFoot}>
                            <span className={styles.recoPrice}>
                              {money(priceOf(c))}
                            </span>
                            <Link
                              href={`/courses/${c.id}`}
                              className={styles.recoLink}
                            >
                              {t("dash.view")}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Mentors -------- */}
            {section === "mentors" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.mentorsTitle")}</h1>
                  <p>{t("dash.mentorsSub")}</p>
                </div>
                {followedMentors.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-users"></i>
                    <p>{t("dash.mentorsEmpty")}</p>
                    <Link href="/mentors" className={styles.primaryBtn}>
                      {t("dash.findMentors")}
                    </Link>
                  </div>
                ) : (
                  <div className={styles.mentorList}>
                    {followedMentors.map((m) => (
                      <div key={m.id} className={styles.mentorItem}>
                        <img
                          className={styles.mAvatar}
                          src={m.profilePicture}
                          alt={mentorDisplayName(m, locale)}
                        />
                        <div className={styles.mInfo}>
                          <b>{mentorDisplayName(m, locale)}</b>
                          <span className={styles.mMajor}>{tr(m.major, locale)}</span>
                        </div>
                        <div className={styles.mActions}>
                          <button
                            className={styles.msgBtn}
                            onClick={() => openChat(m.id)}
                          >
                            <i className="fa fa-comment"></i> {t("dash.message")}
                          </button>
                          <Link href={`/mentors/${m.id}`} className={styles.viewBtn}>
                            {t("dash.profile")}
                          </Link>
                          <button
                            className={styles.unfollowBtn}
                            onClick={() => follow(m.id)}
                            title={t("dash.unfollow")}
                          >
                            <i className="fa fa-user-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Schedule -------- */}
            {section === "calendar" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.navSchedule")}</h1>
                  <p>{t("dash.scheduleSub")}</p>
                </div>

                <h3 className={styles.blockTitle}>{t("dash.upcoming")}</h3>
                {sessions.length === 0 ? (
                  <p className={styles.muted}>{t("dash.noSessions")}</p>
                ) : (
                  <div className={styles.agenda}>
                    {sessions.map(({ course, date }) => (
                      <div key={course.id} className={styles.agendaItem}>
                        <div className={styles.agDate}>
                          <span className={styles.agDay}>{date.getDate()}</span>
                          <span className={styles.agMonth}>
                            {date.toLocaleDateString(localeTag(locale), {
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className={styles.agInfo}>
                          <b>{tr(course.subject, locale)}</b>
                          <span>
                            {mentorName(course.mentorId)} ·{" "}
                            {date.toLocaleTimeString(localeTag(locale), {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className={styles.countdownBadge}>{cd(date)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className={styles.blockTitle}>{t("dash.suggested")}</h3>
                <div className={styles.agenda}>
                  {recommended.map((c) => (
                    <div key={c.id} className={`${styles.agendaItem} ${styles.agendaGhost}`}>
                      <div className={styles.agDate}>
                        <span className={styles.agDay}>
                          {new Date(c.date + "T00:00:00").getDate()}
                        </span>
                        <span className={styles.agMonth}>
                          {new Date(c.date + "T00:00:00").toLocaleDateString(
                            localeTag(locale),
                            { month: "short" }
                          )}
                        </span>
                      </div>
                      <div className={styles.agInfo}>
                        <b>{tr(c.subject, locale)}</b>
                        <span>
                          {mentorName(c.mentorId)} · {money(priceOf(c))}
                        </span>
                      </div>
                      <button className={styles.walletBuyBtn} onClick={() => setBuyTarget(c)}>
                        {t("dash.payWithWallet")}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* -------- Wallet -------- */}
            {section === "wallet" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.navWallet")}</h1>
                  <p>{t("dash.walletSub")}</p>
                </div>

                <div className={styles.walletCard}>
                  <span className={styles.wcLabel}>{t("dash.availableBalance")}</span>
                  <span className={styles.wcBalance}>{money(balance ?? student.balance)}</span>
                  <div className={styles.topupRow}>
                    {TOPUP_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        className={styles.topupBtn}
                        onClick={() => setTopUpAmount(a)}
                      >
                        + {money(a)}
                      </button>
                    ))}
                  </div>
                  <span className={styles.wcHint}>
                    <i className="fa fa-info-circle"></i> {t("dash.topupHint")}
                  </span>
                </div>

                <h3 className={styles.blockTitle}>{t("dash.buyFromBalance")}</h3>
                <div className={styles.recoGrid}>
                  {recommended.map((c) => (
                    <div key={c.id} className={styles.recoCard}>
                      <div className={styles.recoThumb}>
                        <CourseBanner subject={c.major} seed={c.id} />
                        <div className={styles.favCorner}>
                          <FavoriteButton courseId={c.id} onChange={reload} />
                        </div>
                      </div>
                      <div className={styles.recoBody}>
                        <b>{tr(c.subject, locale)}</b>
                        <span className={styles.recoMeta}>
                          {mentorName(c.mentorId)}
                        </span>
                        <div className={styles.recoFoot}>
                          <span className={styles.recoPrice}>{money(priceOf(c))}</span>
                          <button
                            className={styles.walletBuyBtn}
                            onClick={() => setBuyTarget(c)}
                          >
                            {t("dash.payFromWallet")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className={styles.blockTitle}>{t("dash.transactions")}</h3>
                <div className={styles.txList}>
                  {student.wallet.map((tx) => (
                    <div key={tx.id} className={styles.txItem}>
                      <span
                        className={styles.txIcon}
                        style={{
                          color: tx.type === "topup" ? "#1d9e75" : "#534ab7",
                        }}
                      >
                        <i className={`fa ${tx.type === "topup" ? "fa-plus" : "fa-graduation-cap"}`}></i>
                      </span>
                      <div className={styles.txInfo}>
                        <b>
                          {tx.type === "topup"
                            ? t("dash.txTopup")
                            : tx.subject
                            ? t("dash.txCourse", { subject: tr(tx.subject, locale) })
                            : tx.label ?? ""}
                        </b>
                        <span>{formatDate(tx.date.slice(0, 10), locale)}</span>
                      </div>
                      <span
                        className={tx.type === "topup" ? styles.txPos : styles.txNeg}
                      >
                        {tx.type === "topup" ? "+" : "−"}
                        {money(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* -------- Receipts (purchase history from Supabase) -------- */}
            {section === "receipts" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.navReceipts")}</h1>
                  <p>{t("dash.receiptsSub")}</p>
                </div>

                {receipts.length === 0 ? (
                  <p className={styles.muted}>{t("dash.noReceipts")}</p>
                ) : (
                  <div className={styles.txList}>
                    {receipts.map((r) => {
                      const c = getCourseById(r.courseId);
                      return (
                        <div key={r.id} className={styles.txItem}>
                          <span className={styles.txIcon} style={{ color: "#534ab7" }}>
                            <i className="fa fa-file-text-o"></i>
                          </span>
                          <div className={styles.txInfo}>
                            <b>{c ? tr(c.subject, locale) : `#${r.courseId}`}</b>
                            <span>
                              {t("dash.receiptRef", { ref: r.ref })} ·{" "}
                              {formatDate(r.date.slice(0, 10), locale)}
                            </span>
                          </div>
                          <span className={styles.txNeg}>−{money(r.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* -------- Notifications -------- */}
            {section === "notifications" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.navNotifications")}</h1>
                  <p>{t("dash.notificationsSub")}</p>
                </div>
                <div className={styles.notifList}>
                  {notifications.map((n) => (
                    <div key={n.id} className={styles.notifItem}>
                      <span
                        className={styles.notifIcon}
                        style={{ background: `${n.accent}1a`, color: n.accent }}
                      >
                        <i className={`fa ${n.icon}`}></i>
                      </span>
                      <div className={styles.notifBody}>
                        <b>{n.title}</b>
                        <span>{n.text}</span>
                      </div>
                      {n.tag && (
                        // dir="ltr" isolates the tag: without it an RTL page
                        // renders "−20%" as "20%−".
                        <span
                          dir="ltr"
                          className={styles.notifTag}
                          style={{ background: `${n.accent}1a`, color: n.accent }}
                        >
                          {n.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ===== Wallet top-up dialog ===== */}
      {/* Mount only while open so the modal's amount/method state resets each
          time — otherwise it keeps the amount from the first time it opened. */}
      {topUpAmount !== null && (
        <TopUpModal
          amount={topUpAmount}
          onClose={() => setTopUpAmount(null)}
          onConfirm={completeTopUp}
        />
      )}

      {/* ===== Confirm purchase dialog ===== */}
      {buyTarget && (
        <div className={styles.overlay} onClick={() => setBuyTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <i className="fa fa-question-circle"></i>
            </div>
            <h3>{t("dash.confirmTitle")}</h3>
            <p>
              {t("dash.confirmText", {
                amount: money(priceOf(buyTarget)),
                course: tr(buyTarget.subject, locale),
              })}
            </p>
            {isMinor(student) && (
              <p className={styles.consentNote}>
                <i className="fa fa-shield"></i>{" "}
                {t("dash.consentNote", { email: student.parentEmail })}
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setBuyTarget(null)}>
                {t("dash.cancel")}
              </button>
              <button className={styles.primaryBtn} onClick={confirmBuy}>
                {isMinor(student)
                  ? t("dash.requestApproval")
                  : t("dash.confirmPay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Docked mentor chat (LinkedIn-style) ===== */}
      {chatMentor !== null && (
        <ChatDock
          key={chatMentor}
          mentorId={chatMentor}
          minimized={chatMin}
          onToggleMinimize={() => setChatMin((m) => !m)}
          onClose={() => setChatMentor(null)}
        />
      )}

      {/* ===== Toast ===== */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
