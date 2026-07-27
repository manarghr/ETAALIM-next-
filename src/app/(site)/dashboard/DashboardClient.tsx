"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import AttachmentView from "@/components/AttachmentView";
import { useRouter } from "next/navigation";
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
import { getProgressCounts, pctOf } from "@/lib/progress";
import FavoriteButton from "@/components/FavoriteButton";
import { getFollowedMentorIds, toggleFollow } from "@/lib/follows";
import { getMyEnrollments, Enrollment } from "@/lib/enrollment";
import { getReceipts, Receipt } from "@/lib/receipts";
import { getBalance, topUp, getTransactions, WalletTx } from "@/lib/wallet";
import { getFavoriteIds, getFavorites } from "@/lib/favorites";
import { getSeenAt, markSeen } from "@/lib/seen";
import { getRegisteredMentors } from "@/lib/registeredMentors";
import { getProfile, Profile } from "@/lib/profile";
import { getApprovals, createApproval, setApprovalStatus, Approval } from "@/lib/approvals";
import { countdownOf } from "@/lib/schedule";
import {
  getStudentInbox,
  getThread,
  sendMessage,
  subscribeStudentInbox,
  subscribeThread,
  readFileAsAttachment,
  StudentThread,
  Message,
  Attachment,
} from "@/lib/messages";
import styles from "./dashboard.module.css";
// Reuse the mentor dashboard's inbox styling so both panels look identical.
import ibx from "../mentor-dashboard/mentor.module.css";
import { getLastRead, markThreadRead } from "@/lib/threadReads";
import {
  getStudentNotifications,
  getStudentNotifSeenAt,
  markStudentNotifsSeen,
  subscribeStudentNotifications,
  StudentNotification,
} from "@/lib/studentNotifications";

type Mentor = NonNullable<ReturnType<typeof getMentorById>>;
type Section =
  | "overview"
  | "courses"
  | "saved"
  | "mentors"
  | "calendar"
  | "wallet"
  | "receipts"
  | "messages"
  | "notifications";

const NAV: { key: Section; labelKey: string; icon: string }[] = [
  { key: "overview", labelKey: "dash.navOverview", icon: "fa-th-large" },
  { key: "courses", labelKey: "dash.navCourses", icon: "fa-book" },
  { key: "saved", labelKey: "dash.navSaved", icon: "fa-star" },
  { key: "mentors", labelKey: "dash.navMentors", icon: "fa-users" },
  { key: "calendar", labelKey: "dash.navSchedule", icon: "fa-calendar" },
  { key: "wallet", labelKey: "dash.navWallet", icon: "fa-money" },
  { key: "receipts", labelKey: "dash.navReceipts", icon: "fa-file-text-o" },
  { key: "messages", labelKey: "dash.navMessages", icon: "fa-comments" },
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
  const [toast, setToast] = useState<string | null>(null);

  // Messages panel: all conversations, the open one, its live messages, and the
  // slide-in "new message" notification.
  const [inbox, setInbox] = useState<StudentThread[]>([]);
  const [activeMentorId, setActiveMentorId] = useState<number | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyAttach, setReplyAttach] = useState<Attachment | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  // Real notifications feed (mentor replies / purchases / top-ups) + last seen.
  const [studentNotifs, setStudentNotifs] = useState<StudentNotification[]>([]);
  const [notifSeen, setNotifSeen] = useState<string>("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Load the user's real purchased courses from Supabase.
  useEffect(() => {
    getMyEnrollments().then(setEnrollments);
  }, [section]);

  // Load the user's real favorites (refreshes when a star is toggled). We keep
  // both the ids (for the Saved list) and the dated rows (for the "new" badge).
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesData, setFavoritesData] = useState<
    { courseId: number; date: string }[]
  >([]);
  useEffect(() => {
    getFavoriteIds().then(setFavoriteIds);
    getFavorites().then(setFavoritesData);
  }, [section, tick]);

  // "New since last opened" markers for the My Courses & Saved tabs.
  const [coursesSeen, setCoursesSeen] = useState<string>("");
  const [savedSeen, setSavedSeen] = useState<string>("");
  useEffect(() => {
    if (!mounted) return;
    getSeenAt("courses_seen_at").then(setCoursesSeen);
    getSeenAt("saved_seen_at").then(setSavedSeen);
  }, [mounted]);

  // Load the real wallet history (top-ups + purchases).
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  useEffect(() => {
    getTransactions().then(setTransactions);
  }, [section, tick]);

  // Load the real profile (name + grade shown in the sidebar / welcome).
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  // Registered (non-seed) mentors, so followed/messaged real mentors resolve.
  const [registeredMentors, setRegisteredMentors] = useState<Mentor[]>([]);
  useEffect(() => {
    getRegisteredMentors().then(setRegisteredMentors);
  }, []);

  // Load the mentors the user follows (refreshes on follow/unfollow).
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  useEffect(() => {
    getFollowedMentorIds().then(setFollowedIds);
  }, [section, tick]);

  // Load the parental-consent requests (minors' pending purchases).
  const [approvals, setApprovals] = useState<Approval[]>([]);
  useEffect(() => {
    getApprovals().then(setApprovals);
  }, [section, tick]);

  // Load lesson-completion counts (for the My Courses progress bars).
  const [progressCounts, setProgressCounts] = useState<Record<number, number>>({});
  useEffect(() => {
    getProgressCounts().then(setProgressCounts);
  }, [section]);

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
    // Gate: a real supabase, logged-in user can see the dashboard
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user }}) => {
      if (!user) {
        router.replace("/login");
      } else {
        setMounted(true); //confirmed -> show the dahsboard
        // Arriving from a notification (?view=messages) or a "Message" button on
        // a mentor's profile (?chat=<id>) opens the Messages panel.
        const params = new URLSearchParams(window.location.search);
        if (params.get("view") === "messages") setSection("messages");
        const chat = params.get("chat");
        if (chat) {
          setActiveMentorId(parseInt(chat, 10));
          setSection("messages");
        }
      }
    });
  }, [router]);

  // Load all conversations, and keep them live. A mentor's reply refreshes the
  // list and pops the "new message" toast (when the panel isn't already open).
  useEffect(() => {
    if (!mounted) return;
    getStudentInbox().then(setInbox);
    const unsubscribe = subscribeStudentInbox(() => {
      getStudentInbox().then(setInbox);
    });
    return unsubscribe;
  }, [mounted]);

  // Load the real notifications feed and keep it live.
  useEffect(() => {
    if (!mounted) return;
    getStudentNotifications().then(setStudentNotifs);
    getStudentNotifSeenAt().then(setNotifSeen);
    const unsubscribe = subscribeStudentNotifications(() => {
      getStudentNotifications().then(setStudentNotifs);
    });
    return unsubscribe;
  }, [mounted]);

  // Viewing the Notifications tab marks everything seen (newest server time).
  useEffect(() => {
    if (section !== "notifications" || studentNotifs.length === 0) return;
    const newest = studentNotifs[0].date;
    markStudentNotifsSeen(newest);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifSeen(newest);
  }, [section, studentNotifs]);

  const notifUnread = studentNotifs.filter((n) => n.date > notifSeen).length;

  // Opening My Courses / Saved marks their new items seen (newest server time).
  useEffect(() => {
    if (section !== "courses" || enrollments.length === 0) return;
    const newest = enrollments[0].date;
    markSeen("courses_seen_at", newest);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoursesSeen(newest);
  }, [section, enrollments]);
  useEffect(() => {
    if (section !== "saved" || favoritesData.length === 0) return;
    const newest = favoritesData[0].date;
    markSeen("saved_seen_at", newest);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedSeen(newest);
  }, [section, favoritesData]);

  const coursesUnread = enrollments.filter((e) => e.date > coursesSeen).length;
  const savedUnread = favoritesData.filter((f) => f.date > savedSeen).length;

  // The open conversation: load its messages and keep them live.
  useEffect(() => {
    if (activeMentorId === null) return;
    getThread(activeMentorId).then(setActiveMessages);
    const unsubscribe = subscribeThread(activeMentorId, () => {
      getThread(activeMentorId).then(setActiveMessages);
    });
    return unsubscribe;
  }, [activeMentorId]);

  const reload = () => setTick((n) => n + 1);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  // Open a conversation with a mentor in the Messages panel.
  const openChat = (id: number) => {
    setActiveMentorId(id);
    setSection("messages");
  };

  // Send the student's message in the open conversation.
  const sendReply = async () => {
    if (activeMentorId === null || (!replyText.trim() && !replyAttach)) return;
    const updated = await sendMessage(
      activeMentorId,
      replyText.trim(),
      replyAttach ?? undefined
    );
    setActiveMessages(updated);
    setReplyText("");
    setReplyAttach(null);
    getStudentInbox().then(setInbox);
  };
  const pickReplyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const att = await readFileAsAttachment(file);
    if (att) setReplyAttach(att);
    else showToast(t("chat.tooLarge", { max: "3 MB" }));
  };

  // A thread is unread when its newest message is from the mentor, it isn't the
  // one currently open, and it arrived after the student last opened it.
  const isUnread = (th: StudentThread) => {
    const last = th.messages[th.messages.length - 1];
    if (!last || last.from !== "mentor") return false;
    if (activeMentorId === th.mentorSeedId) return false; // open = read
    return last.date > getLastRead(`s:${th.mentorSeedId}`);
  };
  const msgUnread = inbox.filter(isUnread).length;

  // "in 10 minutes" / "خلال 10 دقائق" — the phrase lives in the dictionary.
  const cd = (date: Date) => {
    const { key, n } = countdownOf(date, base);
    return t(key, { n });
  };
  const money = (amount: number) => formatDZD(amount, locale);
  // Resolve a mentor id to a seed mentor or a registered one.
  const resolveMentor = (id: number): Mentor | null =>
    getMentorById(id) ?? registeredMentors.find((m) => m.id === id) ?? null;
  const mentorName = (id: number) => {
    const m = resolveMentor(id);
    return m ? mentorDisplayName(m, locale) : "";
  };
  // ----- derived state (re-read on every render; cheap) -----
  void tick;

  // Identity + education come from the real Supabase profile.
  const displayName = profile?.name ?? "";
  const displayInitials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const displayGrade = profile?.cycle
    ? educationLabel(
        {
          cycle: profile.cycle as Cycle,
          year: profile.year ?? "",
          extra: profile.stream ?? "",
        },
        locale
      )
    : "";
  // A minor (under 18) needs parental consent for purchases.
  const minor = profile?.age != null && profile.age < 18;
  const parentEmail = profile?.parentEmail ?? "";

  // Dedupe by course: a student can now enroll in the same course in several
  // modes (recorded + private…), but it's still one course in their list.
  const seenCourseIds = new Set<number>();
  const enrolledCourses = enrollments
    .map((e) => ({ e, course: getCourseById(e.courseId) }))
    .filter((x): x is { e: Enrollment; course: Course } => Boolean(x.course))
    .filter((x) => {
      if (seenCourseIds.has(x.course.id)) return false;
      seenCourseIds.add(x.course.id);
      return true;
    });

  // Real session dates come from each course's scheduled date + time.
  const sessions = enrolledCourses
    .map((x) => ({
      ...x,
      date: new Date(`${x.course.date}T${x.course.time || "16:00"}`),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const followedMentors = followedIds
    .map((id) => resolveMentor(id))
    .filter((m): m is Mentor => Boolean(m));

  const recommended = courses
    .filter((c) => !enrollments.some((e) => e.courseId === c.id))
    .filter((c) => c.tier === "High School")
    .slice(0, 4);

  const savedCourses = favoriteIds
    .map((id) => getCourseById(id))
    .filter((c): c is Course => Boolean(c));

  const pendingConsent = approvals.filter((a) => a.status === "pending");

  const nextSession = sessions[0];

  // Real lesson-completion progress (0 until the student starts a course).
  const progressFor = (c: Course) =>
    pctOf(progressCounts[c.id] ?? 0, getLessons(c.id, c.major).length);

  const priceOf = (c: Course) => getJoinOption(c, "recorded").price;

  // ----- actions -----
  const confirmBuy = async () => {
    const c = buyTarget;
    if (!c) return;
    const price = priceOf(c);
    setBuyTarget(null);

    // Minors go through the parental-consent flow (a pending approval request).
    if (minor) {
      await createApproval({
        courseId: c.id,
        courseName: c.subject,
        amount: price,
        mode: "recorded",
        parentEmail: parentEmail,
      });
      reload();
      showToast(t("dash.toastApprovalSent", { email: parentEmail }));
      return;
    }

    // Real purchase: the same safe transaction the checkout page uses.
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("enroll_in_course", {
        p_course_id: c.id,
        p_mode: "recorded",
        p_price: price,
        p_subject: c.subject,
      });
      if (error) {
        showToast(error.message); // "Insufficient balance" / "Already enrolled"
        return;
      }
      const b = await getBalance();
      if (b !== null) setBalance(b);
      reload();
      showToast(t("dash.toastEnrolled", { course: tr(c.subject, locale) }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Purchase failed");
    }
  };

  const approveConsent = async (reqId: number) => {
    const req = approvals.find((r) => r.id === reqId);
    if (!req) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("enroll_in_course", {
        p_course_id: req.courseId,
        p_mode: req.mode,
        p_price: req.amount,
        p_subject: req.courseName,
      });
      if (error) {
        showToast(error.message);
        return;
      }
      await setApprovalStatus(req.id, "approved");
      const b = await getBalance();
      if (b !== null) setBalance(b);
      reload();
      showToast(t("dash.toastApproved"));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed");
    }
  };

  const denyConsent = async (reqId: number) => {
    await setApprovalStatus(reqId, "denied");
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
      reload();
      showToast(t("dash.toastToppedUp", { amount: money(amount) }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Top-up failed");
    }
  };

  const follow = async (id: number) => {
    await toggleFollow(id, followedIds.includes(id));
    reload();
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
              <div className={styles.avatar}>{displayInitials}</div>
              <div className={styles.pName}>{displayName}</div>
              <div className={styles.pGrade}>{displayGrade}</div>
            </div>

            <div className={styles.walletMini}>
              <span className={styles.wmLabel}>{t("dash.walletBalance")}</span>
              <span className={styles.wmValue}>{money(balance ?? 0)}</span>
            </div>

            <nav className={styles.nav}>
              {NAV.map((item) => {
                const count =
                  item.key === "notifications"
                    ? notifUnread
                    : item.key === "courses"
                    ? coursesUnread
                    : item.key === "saved"
                    ? savedUnread
                    : item.key === "messages"
                    ? msgUnread
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
                    {t("dash.welcome", { name: displayName.split(" ")[0] })}
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
                    <span className={styles.statValue}>{money(balance ?? 0)}</span>
                    <span className={styles.statLabel}>{t("dash.walletBalance")}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-bell"></i>
                    </span>
                    <span className={styles.statValue}>{studentNotifs.length}</span>
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
                            {t("dash.approvalsMeta", { email: c.parentEmail ?? "" })}
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
                  <span className={styles.wcBalance}>{money(balance ?? 0)}</span>
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
                  {transactions.map((tx) => (
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
                            : ""}
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

            {/* -------- Messages -------- */}
            {section === "messages" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>{t("dash.messagesTitle")}</h1>
                  <p>{t("dash.messagesSub")}</p>
                </div>
                {inbox.length === 0 && activeMentorId === null ? (
                  <div className={styles.empty}>
                    <i className="fa fa-comments-o"></i>
                    <p>{t("dash.messagesEmpty")}</p>
                    <Link href="/mentors" className={styles.primaryBtn}>
                      {t("dash.findMentors")}
                    </Link>
                  </div>
                ) : (
                  <div className={ibx.inbox}>
                    <div className={ibx.threadList}>
                      {inbox.map((th) => {
                        const last = th.messages[th.messages.length - 1];
                        return (
                          <button
                            key={th.mentorSeedId}
                            className={`${ibx.threadItem} ${
                              activeMentorId === th.mentorSeedId ? ibx.threadActive : ""
                            }`}
                            onClick={() => {
                              markThreadRead(`s:${th.mentorSeedId}`, last?.date ?? "");
                              setActiveMentorId(th.mentorSeedId);
                              reload();
                            }}
                          >
                            <span className={ibx.studentAvatar}>{th.initials}</span>
                            <div className={ibx.threadInfo}>
                              <b>{mentorName(th.mentorSeedId) || th.mentorName}</b>
                              <span>{last?.text ?? ""}</span>
                            </div>
                            {isUnread(th) && <span className={ibx.dot} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className={ibx.threadView}>
                      {activeMentorId === null ? (
                        <div className={ibx.threadEmpty}>
                          <i className="fa fa-comments-o"></i>
                          <p>{t("dash.selectConversation")}</p>
                        </div>
                      ) : (
                        <>
                          <div className={ibx.threadHead}>
                            <button
                              type="button"
                              className={ibx.threadBack}
                              onClick={() => setActiveMentorId(null)}
                              aria-label={t("dash.back")}
                            >
                              <i className="fa fa-arrow-left"></i>
                            </button>
                            <span className={ibx.studentAvatar}>
                              {(mentorName(activeMentorId) || "?")
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                            <b>{mentorName(activeMentorId)}</b>
                          </div>
                          <div className={ibx.bubbles}>
                            {activeMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`${ibx.bubble} ${
                                  msg.from === "student" ? ibx.bubbleMine : ibx.bubbleTheirs
                                }`}
                              >
                                {msg.attachment && (
                                  <AttachmentView attachment={msg.attachment} />
                                )}
                                {msg.text && <div>{msg.text}</div>}
                              </div>
                            ))}
                          </div>
                          {replyAttach && (
                            <div className={ibx.pendingAttach}>
                              <i className="fa fa-paperclip"></i>
                              <span>{replyAttach.name}</span>
                              <button
                                type="button"
                                onClick={() => setReplyAttach(null)}
                                aria-label="remove"
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            </div>
                          )}
                          <div className={ibx.replyBar}>
                            <input
                              ref={replyFileRef}
                              type="file"
                              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                              hidden
                              onChange={pickReplyFile}
                            />
                            <button
                              type="button"
                              className={ibx.attachBtn}
                              onClick={() => replyFileRef.current?.click()}
                              aria-label={t("chat.attach")}
                            >
                              <i className="fa fa-paperclip"></i>
                            </button>
                            <input
                              type="text"
                              placeholder={t("dash.msgPlaceholder")}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && sendReply()}
                            />
                            <button
                              onClick={sendReply}
                              disabled={!replyText.trim() && !replyAttach}
                            >
                              <i className="fa fa-paper-plane"></i>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
                {studentNotifs.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-bell-o"></i>
                    <p>{t("dash.notifEmpty")}</p>
                  </div>
                ) : (
                  <div className={styles.notifList}>
                    {studentNotifs.map((n) => {
                      const cfg =
                        n.type === "reply"
                          ? {
                              icon: "fa-comment",
                              accent: "#534ab7",
                              title: t("dash.notifReply", {
                                mentor: n.actorName ?? "",
                              }),
                            }
                          : n.type === "enroll"
                          ? {
                              icon: "fa-graduation-cap",
                              accent: "#0e9f9c",
                              title: t("dash.notifEnrolled", {
                                course: n.detail ? tr(n.detail, locale) : "",
                              }),
                            }
                          : {
                              icon: "fa-money",
                              accent: "#16a34a",
                              title: t("dash.notifTopup", {
                                amount: money(n.amount ?? 0),
                              }),
                            };
                      return (
                        <div key={n.id} className={styles.notifItem}>
                          <span
                            className={styles.notifIcon}
                            style={{ background: `${cfg.accent}1a`, color: cfg.accent }}
                          >
                            <i className={`fa ${cfg.icon}`}></i>
                          </span>
                          <div className={styles.notifBody}>
                            <b>{cfg.title}</b>
                            <span>
                              {new Date(n.date).toLocaleString(
                                locale === "ar" ? "ar-DZ-u-nu-latn" : locale,
                                { dateStyle: "medium", timeStyle: "short" }
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
            {minor && (
              <p className={styles.consentNote}>
                <i className="fa fa-shield"></i>{" "}
                {t("dash.consentNote", { email: parentEmail })}
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setBuyTarget(null)}>
                {t("dash.cancel")}
              </button>
              <button className={styles.primaryBtn} onClick={confirmBuy}>
                {minor
                  ? t("dash.requestApproval")
                  : t("dash.confirmPay")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Toast ===== */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
