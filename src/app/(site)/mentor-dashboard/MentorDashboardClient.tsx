"use client";

import {
  getEnrollmentCounts,
  getMentorRoster,
  getMentorEarnings,
  getStudentsSeenAt,
  markStudentsSeen,
  subscribeEnrollments,
  RosterEntry,
  EarningTx,
} from "@/lib/mentorRoster";
import { useEffect, useState, useRef, FormEvent } from "react";
import AttachmentView from "@/components/AttachmentView";
import { Attachment, readFileAsAttachment } from "@/lib/messages";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { tr } from "@/data/localized";
import { TIERS, TRACKS, formatDZD, formatDate } from "@/data/courses";
import { getRoster } from "@/data/roster";
import { countdownOf } from "@/lib/schedule";
import { getMentorAccount, updateMentorProfile } from "@/lib/mentor";
import {
  getMentorCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  MentorCourse,
  CourseInput,
} from "@/lib/mentorCourses";
import {
  getInbox,
  replyToThread,
  subscribeInbox,
  InboxThread,
} from "@/lib/mentorInbox";
import { Certificate } from "@/data/mentors";
import MentorMedia from "@/components/MentorMedia";
import {
  getMyMentorProfile,
  getMyMentorPublicId,
  saveMyMentorProfile,
  isMentorSignedIn,
  MentorProfileData,
} from "@/lib/mentorProfile";
import { getLastRead, markThreadRead } from "@/lib/threadReads";
import {
  getMentorNotifications,
  getNotifSeenAt,
  markNotifsSeen,
  subscribeNotifications,
  MentorNotification,
} from "@/lib/mentorNotifications";
import shared from "../dashboard/dashboard.module.css";
import m from "./mentor.module.css";
// Reuse the real student-facing profile styles so the preview is pixel-identical.
import pv from "../mentors/[id]/page.module.css";

type Section =
  | "overview"
  | "courses"
  | "students"
  | "schedule"
  | "earnings"
  | "messages"
  | "notifications"
  | "profile";

const NAV: { key: Section; labelKey: string; icon: string }[] = [
  { key: "overview", labelKey: "mentorDash.navOverview", icon: "fa-th-large" },
  { key: "courses", labelKey: "mentorDash.navCourses", icon: "fa-book" },
  { key: "students", labelKey: "mentorDash.navStudents", icon: "fa-users" },
  { key: "schedule", labelKey: "mentorDash.navSchedule", icon: "fa-calendar" },
  { key: "earnings", labelKey: "mentorDash.navEarnings", icon: "fa-money" },
  { key: "messages", labelKey: "mentorDash.navMessages", icon: "fa-comments" },
  { key: "notifications", labelKey: "mentorDash.navNotifications", icon: "fa-bell" },
  { key: "profile", labelKey: "mentorDash.navProfile", icon: "fa-id-card" },
];

// The three ways a student can enroll — the Students tab groups by these.
const MODE_GROUPS: { mode: string; labelKey: string; icon: string }[] = [
  { mode: "recorded", labelKey: "mentorDash.grpRecorded", icon: "fa-play-circle" },
  { mode: "group", labelKey: "mentorDash.grpGroup", icon: "fa-users" },
  { mode: "individual", labelKey: "mentorDash.grpIndividual", icon: "fa-user" },
];

const EMPTY_FORM: CourseInput = {
  subject: "",
  description: "",
  major: "",
  tier: "High School",
  track: "",
  level: "",
  date: "",
  time: "16:00",
  price: 1500,
  priceGroup: 2500,
  priceIndividual: 4000,
  status: "available",
};

export default function MentorDashboardClient() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [section, setSection] = useState<Section>("overview");
  const [base] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);

  // "View as a student" — preview the public profile from the current (unsaved)
  // form values before committing them.
  const [showPreview, setShowPreview] = useState(false);

  // Course editor: null = closed, "new" or a course object = open
  const [editing, setEditing] = useState<MentorCourse | "new" | null>(null);
  const [form, setForm] = useState<CourseInput>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<MentorCourse | null>(null);

  // The mentor's courses, loaded from Supabase (their owned catalog rows).
  const [courses, setCourses] = useState<MentorCourse[]>([]);
  // The mentor's numeric public id — new courses are attributed to it so they
  // show on the public directory/profile.
  const [publicId, setPublicId] = useState<number | null>(null);
  // Real enrolled students (for the Students tab, grouped by session type).
  const [realRoster, setRealRoster] = useState<RosterEntry[]>([]);
  // Real earnings (payments from enrollments in the mentor's courses).
  const [earnings, setEarnings] = useState<EarningTx[]>([]);
  // The mentor's real identity (name/avatar/major/teaching…) from Supabase.
  const [mentorInfo, setMentorInfo] = useState<MentorProfileData | null>(null);
  // Activity feed (messages / enrollments / follows) + when it was last seen.
  const [notifs, setNotifs] = useState<MentorNotification[]>([]);
  const [notifSeen, setNotifSeen] = useState<string>("");
  // When the Students tab was last opened — drives the "new enrollments" badge.
  const [studentsSeen, setStudentsSeen] = useState<string>("");
  const [counts, setCounts] = useState<Record<number, number>>({}); 
  
  // Messages — inbox comes from Supabase (real student threads), kept live.
  const [inbox, setInbox] = useState<InboxThread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttach, setReplyAttach] = useState<Attachment | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  // Profile form — mirrors the public mentor profile fields
  const [pTitle, setPTitle] = useState("");
  const [pBio, setPBio] = useState("");
  const [pMajor, setPMajor] = useState("");
  const [pLevel, setPLevel] = useState("");
  const [pExp, setPExp] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pRate, setPRate] = useState("");
  const [pAvail, setPAvail] = useState("");
  const [pSkills, setPSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [pCerts, setPCerts] = useState<Certificate[]>([]);
  const [pAch, setPAch] = useState<string[]>([]);
  const [achInput, setAchInput] = useState("");

  // Gate to mentors + load the client-only account after hydration. The
  // setState calls here are the intentional hydration gate.
  useEffect(() => {
    let cancelled = false;
    // The real Supabase session decides — a mentor who signed in with Google
    // has no localStorage session at all. Fall back to the mock session for the
    // seed-mentor demo logins that still run on it.
    isMentorSignedIn().then((allowed) => {
      if (cancelled) return;
      if (allowed) {
        boot();
      } else {
        router.replace("/login");
      }
    });
    return () => {
      cancelled = true;
    };

    function boot() {
    const acc = getMentorAccount();
    setPTitle(acc.title);
    setPBio(acc.bioOverride);
    setPMajor(acc.major);
    setPLevel(acc.level);
    setPExp(String(acc.experience));
    setPPhone(acc.phone);
    setPRate(String(acc.hourlyRate));
    setPAvail(acc.availability);
    setPSkills(acc.skills ? acc.skills.split(",").map((x) => x.trim()).filter(Boolean) : []);
    setPCerts(acc.certificates ?? []);
    setPAch(acc.achievements ?? []);
    setMounted(true);
    // Arriving from a "new message" notification opens the Messages tab.
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "messages") setSection("messages");

    // Override the localStorage seed with the mentor's REAL saved profile from
    // Supabase (only the fields they've actually set, so a seed mentor keeps
    // their rich demo data until they save their own).
    getMyMentorProfile().then((prof) => {
      if (!prof) return;
      setMentorInfo(prof);
      if (prof.title) setPTitle(prof.title);
      if (prof.bio) setPBio(prof.bio);
      if (prof.major) setPMajor(prof.major);
      if (prof.level) setPLevel(prof.level);
      if (prof.experience) setPExp(String(prof.experience));
      if (prof.phone) setPPhone(prof.phone);
      if (prof.hourlyRate) setPRate(String(prof.hourlyRate));
      if (prof.availability) setPAvail(prof.availability);
      if (prof.skills.length) setPSkills(prof.skills);
      if (prof.certificates.length) setPCerts(prof.certificates);
      if (prof.achievements.length) setPAch(prof.achievements);
    });
    }
  }, [router]);

  // Load the mentor's courses and their real enrollment counts from Supabase,
  // and keep the counts live as students enroll.
  useEffect(() => {
    if (!mounted) return;
    getMentorCourses().then(setCourses);
    getMyMentorPublicId().then(setPublicId);
    getEnrollmentCounts().then(setCounts);
    getMentorRoster().then(setRealRoster);
    getMentorEarnings().then(setEarnings);
    getStudentsSeenAt().then(setStudentsSeen);
    const unsubscribe = subscribeEnrollments(() => {
      getEnrollmentCounts().then(setCounts);
      getMentorRoster().then(setRealRoster);
      getMentorEarnings().then(setEarnings);
    });
    return unsubscribe;
  }, [mounted]);

  // Viewing the Students tab marks new enrollments seen (newest server time).
  useEffect(() => {
    if (section !== "students" || realRoster.length === 0) return;
    const newest = realRoster[0].date;
    markStudentsSeen(newest);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudentsSeen(newest);
  }, [section, realRoster]);

  const studentsUnread = realRoster.filter((r) => r.date > studentsSeen).length;

  // Load the activity feed and keep it live.
  useEffect(() => {
    if (!mounted) return;
    getMentorNotifications().then(setNotifs);
    getNotifSeenAt().then(setNotifSeen);
    const unsubscribe = subscribeNotifications(() => {
      getMentorNotifications().then(setNotifs);
    });
    return unsubscribe;
  }, [mounted]);

  // Viewing the Notifications tab marks everything up to the newest item seen
  // (using its server timestamp, so clock skew can't leave the badge stuck).
  useEffect(() => {
    if (section !== "notifications" || notifs.length === 0) return;
    const newest = notifs[0].date;
    markNotifsSeen(newest);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifSeen(newest);
  }, [section, notifs]);

  const notifUnread = notifs.filter((n) => n.date > notifSeen).length;

  // Load the real student inbox from Supabase and keep it live: refetch whenever
  // a student sends a new message.
  useEffect(() => {
    if (!mounted) return;
    getInbox().then(setInbox);
    const unsubscribe = subscribeInbox(() => {
      getInbox().then(setInbox);
    });
    return unsubscribe;
  }, [mounted]);

  const reload = () => setTick((n) => n + 1);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  const money = (n: number) => formatDZD(n, locale);

  // ----- derived (cheap; re-read each render) -----
  void tick;
  const account = getMentorAccount();
  const mentorId = account.id;
  const rating = (4.6 + (mentorId % 4) * 0.1).toFixed(1);

  // Display identity: prefer the real Supabase profile, fall back to the cached
  // account for the first render before it loads.
  const meName = mentorInfo?.name || account.name;
  const meAvatar = mentorInfo?.profilePicture || account.profilePicture;
  const meMajor = mentorInfo?.major || account.major;
  const meTitle = mentorInfo?.title || account.title;
  const meEmail = mentorInfo?.email || account.email;
  const mePhone = mentorInfo?.phone || account.phone;
  const meExperience = mentorInfo?.experience ?? account.experience;
  const meTeaching = mentorInfo?.teaching?.length
    ? mentorInfo.teaching
    : account.teaching;


  // Real session dates from each course's scheduled date + time.
  const sessions = courses
    .map((c) => ({
      course: c,
      date: new Date(`${c.date || "2099-01-01"}T${c.time || "16:00"}`),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // A thread is unread when its newest message is from the student, it isn't the
  // one currently open, and it arrived after the mentor last opened it.
  const isUnread = (th: InboxThread) => {
    const last = th.messages[th.messages.length - 1];
    if (!last || last.from !== "student") return false;
    if (activeThread === th.studentId) return false; // open = read
    return last.date > getLastRead(`m:${th.studentId}`);
  };
  const unread = inbox.filter(isUnread).length;

  // Real earnings (from actual enrollments in the mentor's courses).
  const earned = earnings.reduce((sum, tx) => sum + tx.amount, 0);
  const now = new Date();
  const thisMonth = earnings
    .filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  // earnings grouped by course subject
  const byCourse = earnings.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.subject] = (acc[tx.subject] ?? 0) + tx.amount;
    return acc;
  }, {});

  const cd = (date: Date) => {
    const { key, n } = countdownOf(date, base);
    return t(key, { n });
  };
  const courseTitle = (c: MentorCourse) =>
    c.custom ? c.subject : tr(c.subject, locale);

  // ----- actions -----
  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
  };
  const openEdit = (c: MentorCourse) => {
    setForm({
      subject: c.subject,
      description: c.description ?? "",
      major: c.major,
      tier: c.tier,
      track: c.track ?? "",
      level: c.level,
      date: c.date ?? "",
      time: c.time ?? "16:00",
      price: c.price,
      priceGroup: c.priceGroup ?? 0,
      priceIndividual: c.priceIndividual ?? 0,
      status: c.status,
    });
    setEditing(c);
  };
  const saveCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    if (editing === "new") {
      setCourses(await addCourse(publicId ?? mentorId, form));
      showToast(t("mentorDash.toastCourseCreated"));
    } else if (editing) {
      setCourses(await updateCourse(editing.id, form));
      showToast(t("mentorDash.toastCourseUpdated"));
    }
    setEditing(null);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setCourses(await deleteCourse(deleteTarget.id));
    setDeleteTarget(null);
    showToast(t("mentorDash.toastCourseDeleted"));
  };

  const thread = inbox.find((th) => th.studentId === activeThread) ?? null;
  const sendReply = async () => {
    if (!thread || (!replyText.trim() && !replyAttach)) return;
    const updated = await replyToThread(
      thread.studentId,
      replyText.trim(),
      replyAttach ?? undefined
    );
    setInbox(updated);
    setReplyText("");
    setReplyAttach(null);
    showToast(t("mentorDash.toastReplySent"));
  };
  const pickReplyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const att = await readFileAsAttachment(file);
    if (att) setReplyAttach(att);
    else showToast(t("chat.tooLarge", { max: "3 MB" }));
  };

  // Skill tag helpers
  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !pSkills.includes(v)) setPSkills((k) => [...k, v]);
    setSkillInput("");
  };
  const removeSkill = (v: string) =>
    setPSkills((k) => k.filter((x) => x !== v));

  // Certification helpers
  const addCert = () =>
    setPCerts((c) => [...c, { name: "", issuer: "", year: new Date().getFullYear() }]);
  const updateCert = (i: number, patch: Partial<Certificate>) =>
    setPCerts((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeCert = (i: number) =>
    setPCerts((c) => c.filter((_, idx) => idx !== i));

  // Achievement helpers
  const addAchievement = () => {
    const v = achInput.trim();
    if (v) setPAch((a) => [...a, v]);
    setAchInput("");
  };
  const removeAchievement = (i: number) =>
    setPAch((a) => a.filter((_, idx) => idx !== i));

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const certificates = pCerts.filter((c) => c.name.trim() || c.issuer.trim());
    const experience = parseInt(pExp, 10) || 0;
    const hourlyRate = parseInt(pRate, 10) || 0;

    // Persist to Supabase (the real, cross-session source of truth)…
    await saveMyMentorProfile({
      title: pTitle.trim(),
      bio: pBio,
      major: pMajor.trim(),
      level: pLevel.trim(),
      experience,
      phone: pPhone.trim(),
      skills: pSkills,
      certificates,
      achievements: pAch,
      hourlyRate,
      availability: pAvail,
    });
    // …and keep the localStorage account in sync so the sidebar/preview stay
    // consistent for the rest of this session.
    updateMentorProfile({
      title: pTitle.trim(),
      bioOverride: pBio,
      major: pMajor.trim(),
      level: pLevel.trim(),
      experience,
      phone: pPhone.trim(),
      skills: pSkills.join(", "),
      certificates,
      achievements: pAch,
      hourlyRate,
      availability: pAvail,
    });
    showToast(t("mentorDash.toastProfileSaved"));
    reload();
  };

  const inboxText = (msg: InboxThread["messages"][number]) => msg.text ?? "";

  if (!mounted) {
    return (
      <div className={shared.wrap}>
        <div className={shared.container}>
          <div className={shared.skeleton}>…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={shared.wrap}>
      <div className={shared.container}>
        <div className={shared.layout}>
          {/* ===== Sidebar ===== */}
          <aside className={shared.sidebar}>
            <div className={shared.profile}>
              <img className={m.sideAvatar} src={meAvatar} alt={meName} />
              <div className={shared.pName}>{meName}</div>
              <div className={shared.pGrade}>{tr(meMajor, locale)}</div>
            </div>

            <div className={shared.walletMini}>
              <span className={shared.wmLabel}>{t("mentorDash.statEarnings")}</span>
              <span className={shared.wmValue}>{money(earned)}</span>
            </div>

            <nav className={shared.nav}>
              {NAV.map((item) => {
                const count =
                  item.key === "messages"
                    ? unread
                    : item.key === "students"
                    ? studentsUnread
                    : item.key === "notifications"
                    ? notifUnread
                    : 0;
                return (
                  <button
                    key={item.key}
                    className={`${shared.navItem} ${
                      section === item.key ? shared.navActive : ""
                    }`}
                    onClick={() => setSection(item.key)}
                  >
                    <i className={`fa ${item.icon}`}></i>
                    <span>{t(item.labelKey)}</span>
                    {count > 0 && <span className={shared.navBadge}>{count}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ===== Main ===== */}
          <main className={shared.main}>
            {/* -------- Overview -------- */}
            {section === "overview" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.welcome", { name: meName.split(" ")[0] })}</h1>
                  <p>{t("mentorDash.welcomeSub")}</p>
                </div>

                <div className={shared.statGrid}>
                  <div className={shared.statCard}>
                    <span className={shared.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-users"></i>
                    </span>
                    <span className={shared.statValue}>{realRoster.length}</span>
                    <span className={shared.statLabel}>{t("mentorDash.statStudents")}</span>
                  </div>
                  <div className={shared.statCard}>
                    <span className={shared.statIcon} style={{ color: "#1d9e75" }}>
                      <i className="fa fa-book"></i>
                    </span>
                    <span className={shared.statValue}>{courses.length}</span>
                    <span className={shared.statLabel}>{t("mentorDash.statCourses")}</span>
                  </div>
                  <div className={shared.statCard}>
                    <span className={shared.statIcon} style={{ color: "#e0894a" }}>
                      <i className="fa fa-star"></i>
                    </span>
                    <span className={shared.statValue}>{rating}</span>
                    <span className={shared.statLabel}>{t("mentorDash.statRating")}</span>
                  </div>
                  <div className={shared.statCard}>
                    <span className={shared.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-money"></i>
                    </span>
                    <span className={shared.statValue}>{money(earned)}</span>
                    <span className={shared.statLabel}>{t("mentorDash.statEarnings")}</span>
                  </div>
                </div>

                <h3 className={shared.blockTitle}>{t("mentorDash.upcoming")}</h3>
                {sessions.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noSessions")}</p>
                ) : (
                  <div className={shared.agenda}>
                    {sessions.slice(0, 4).map(({ course, date }) => (
                      <div key={course.id} className={shared.agendaItem}>
                        <div className={shared.agDate}>
                          <span className={shared.agDay}>{date.getDate()}</span>
                          <span className={shared.agMonth}>
                            {date.toLocaleDateString(locale === "ar" ? "ar-DZ-u-nu-latn" : locale, { month: "short" })}
                          </span>
                        </div>
                        <div className={shared.agInfo}>
                          <b>{courseTitle(course)}</b>
                          <span>{getRoster(course.id).length} {t("mentorDash.studentsWord")}</span>
                        </div>
                        <span className={shared.countdownBadge}>{cd(date)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className={shared.blockTitle}>{t("mentorDash.recentStudents")}</h3>
                {realRoster.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noStudents")}</p>
                ) : (
                  <div className={m.studentList}>
                    {realRoster.slice(0, 5).map((r, i) => {
                      const course = courses.find((c) => c.id === r.courseId);
                      return (
                        <div
                          key={`${r.courseId}-${r.studentId}-${i}`}
                          className={m.studentRow}
                        >
                          <span className={m.studentAvatar}>{r.initials}</span>
                          <div className={m.studentInfo}>
                            <b>{r.name}</b>
                            <span>{course ? courseTitle(course) : ""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* -------- My Courses -------- */}
            {section === "courses" && (
              <section>
                <div className={m.headRow}>
                  <div className={shared.panelHead} style={{ marginBottom: 0 }}>
                    <h1>{t("mentorDash.coursesTitle")}</h1>
                    <p>{t("mentorDash.coursesSub")}</p>
                  </div>
                  <button className={m.createBtn} onClick={openNew}>
                    <i className="fa fa-plus"></i> {t("mentorDash.createCourse")}
                  </button>
                </div>

                {courses.length === 0 ? (
                  <div className={shared.empty}>
                    <i className="fa fa-book"></i>
                    <p>{t("mentorDash.noCourses")}</p>
                    <button className={shared.primaryBtn} onClick={openNew}>
                      {t("mentorDash.createCourse")}
                    </button>
                  </div>
                ) : (
                  <div className={m.courseList}>
                    {courses.map((c) => (
                      <div key={c.id} className={m.courseCard}>
                        <div className={m.courseMain}>
                          <div className={m.courseTop}>
                            <b>{courseTitle(c)}</b>
                            <span
                              className={`${m.statusBadge} ${
                                c.status === "available" ? m.stAvail : m.stUpcoming
                              }`}
                            >
                              {c.status === "available"
                                ? t("mentorDash.statusAvailable")
                                : t("mentorDash.statusUpcoming")}
                            </span>
                          </div>
                          <span className={m.courseMeta}>
                            {tr(c.major, locale)} · {tr(c.tier, locale)}
                            {c.level ? ` · ${tr(c.level, locale)}` : ""}
                          </span>
                          <div className={m.courseStats}>
                            <span><i className="fa fa-users"></i> {counts[c.id] ?? c.students} {t("mentorDash.studentsWord")}</span>
                            <span><i className="fa fa-money"></i> {money(c.price)}</span>
                            {c.date && (
                              <span><i className="fa fa-calendar"></i> {formatDate(c.date, locale)}</span>
                            )}
                          </div>
                        </div>
                        <div className={m.courseActions}>
                          <button className={m.editBtn} onClick={() => openEdit(c)}>
                            <i className="fa fa-pencil"></i> {t("mentorDash.edit")}
                          </button>
                          <button className={m.delBtn} onClick={() => setDeleteTarget(c)}>
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Students -------- */}
            {section === "students" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.studentsTitle")}</h1>
                  <p>{t("mentorDash.studentsSub")}</p>
                </div>
                {realRoster.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noStudents")}</p>
                ) : (
                  MODE_GROUPS.map((g) => {
                    const list = realRoster.filter((r) => r.mode === g.mode);
                    return (
                      <div key={g.mode} className={m.studentGroup}>
                        <div className={m.groupHead}>
                          <i className={`fa ${g.icon}`}></i>
                          <h3>{t(g.labelKey)}</h3>
                          <span className={m.groupCount}>{list.length}</span>
                        </div>
                        {list.length === 0 ? (
                          <p className={m.groupEmpty}>{t("mentorDash.groupEmpty")}</p>
                        ) : (
                          <div className={m.studentList}>
                            {list.map((r, i) => {
                              const course = courses.find((c) => c.id === r.courseId);
                              return (
                                <div
                                  key={`${r.courseId}-${r.studentId}-${i}`}
                                  className={m.studentRow}
                                >
                                  <span className={m.studentAvatar}>{r.initials}</span>
                                  <div className={m.studentInfo}>
                                    <b>{r.name}</b>
                                    <span>{course ? courseTitle(course) : ""}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </section>
            )}

            {/* -------- Schedule -------- */}
            {section === "schedule" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.scheduleTitle")}</h1>
                  <p>{t("mentorDash.scheduleSub")}</p>
                </div>
                {sessions.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noSessions")}</p>
                ) : (
                  <div className={shared.agenda}>
                    {sessions.map(({ course, date }) => (
                      <div key={course.id} className={shared.agendaItem}>
                        <div className={shared.agDate}>
                          <span className={shared.agDay}>{date.getDate()}</span>
                          <span className={shared.agMonth}>
                            {date.toLocaleDateString(locale === "ar" ? "ar-DZ-u-nu-latn" : locale, { month: "short" })}
                          </span>
                        </div>
                        <div className={shared.agInfo}>
                          <b>{courseTitle(course)}</b>
                          <span>
                            {getRoster(course.id).length} {t("mentorDash.studentsWord")} ·{" "}
                            {date.toLocaleTimeString(locale === "ar" ? "ar-DZ-u-nu-latn" : locale, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span className={shared.countdownBadge}>{cd(date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Earnings -------- */}
            {section === "earnings" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.earningsTitle")}</h1>
                  <p>{t("mentorDash.earningsSub")}</p>
                </div>

                <div className={m.earnGrid}>
                  <div className={m.earnCard}>
                    <span className={m.earnLabel}>{t("mentorDash.totalEarned")}</span>
                    <span className={m.earnValue}>{money(earned)}</span>
                  </div>
                  <div className={m.earnCard}>
                    <span className={m.earnLabel}>{t("mentorDash.thisMonth")}</span>
                    <span className={m.earnValue}>{money(thisMonth)}</span>
                  </div>
                </div>

                <h3 className={shared.blockTitle}>{t("mentorDash.perCourse")}</h3>
                <div className={m.breakdown}>
                  {Object.entries(byCourse).map(([subject, amount]) => (
                    <div key={subject} className={m.breakRow}>
                      <span className={m.breakName}>{tr(subject, locale)}</span>
                      <span className={m.breakAmount}>{money(amount)}</span>
                    </div>
                  ))}
                </div>

                <h3 className={shared.blockTitle}>{t("mentorDash.transactions")}</h3>
                {earnings.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noEarnings")}</p>
                ) : (
                  <div className={m.txList}>
                    {earnings.slice(0, 10).map((tx) => (
                      <div key={tx.id} className={m.txRow}>
                        <span className={m.txIcon}><i className="fa fa-arrow-down"></i></span>
                        <div className={m.txInfo}>
                          <b>{tr(tx.subject, locale)}</b>
                          <span>{t("mentorDash.fromStudent", { student: tx.student })} · {formatDate(tx.date.slice(0, 10), locale)}</span>
                        </div>
                        <span className={m.txAmount}>+{money(tx.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* -------- Messages -------- */}
            {section === "messages" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.messagesTitle")}</h1>
                  <p>{t("mentorDash.messagesSub")}</p>
                </div>
                {inbox.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.inboxEmpty")}</p>
                ) : (
                  <div className={m.inbox}>
                    <div className={m.threadList}>
                      {inbox.map((th) => {
                        const last = th.messages[th.messages.length - 1];
                        return (
                          <button
                            key={th.studentId}
                            className={`${m.threadItem} ${
                              activeThread === th.studentId ? m.threadActive : ""
                            }`}
                            onClick={() => {
                              markThreadRead(`m:${th.studentId}`, last?.date ?? "");
                              setActiveThread(th.studentId);
                              reload();
                            }}
                          >
                            <span className={m.studentAvatar}>{th.initials}</span>
                            <div className={m.threadInfo}>
                              <b>{th.studentName}</b>
                              <span>{inboxText(last)}</span>
                            </div>
                            {isUnread(th) && <span className={m.dot} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className={m.threadView}>
                      {!thread ? (
                        <div className={m.threadEmpty}>
                          <i className="fa fa-comments-o"></i>
                          <p>{t("mentorDash.selectConversation")}</p>
                        </div>
                      ) : (
                        <>
                          <div className={m.threadHead}>
                            <button
                              type="button"
                              className={m.threadBack}
                              onClick={() => setActiveThread(null)}
                              aria-label={t("mentorDash.back")}
                            >
                              <i className="fa fa-arrow-left"></i>
                            </button>
                            <span className={m.studentAvatar}>{thread.initials}</span>
                            <b>{thread.studentName}</b>
                          </div>
                          <div className={m.bubbles}>
                            {thread.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`${m.bubble} ${
                                  msg.from === "mentor" ? m.bubbleMine : m.bubbleTheirs
                                }`}
                              >
                                {msg.attachment && (
                                  <AttachmentView attachment={msg.attachment} />
                                )}
                                {msg.text && <div>{inboxText(msg)}</div>}
                              </div>
                            ))}
                          </div>
                          {replyAttach && (
                            <div className={m.pendingAttach}>
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
                          <div className={m.replyBar}>
                            <input
                              ref={replyFileRef}
                              type="file"
                              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                              hidden
                              onChange={pickReplyFile}
                            />
                            <button
                              type="button"
                              className={m.attachBtn}
                              onClick={() => replyFileRef.current?.click()}
                              aria-label={t("chat.attach")}
                            >
                              <i className="fa fa-paperclip"></i>
                            </button>
                            <input
                              type="text"
                              placeholder={t("mentorDash.replyPh")}
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
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.notifTitle")}</h1>
                  <p>{t("mentorDash.notifSub")}</p>
                </div>
                {notifs.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.notifEmpty")}</p>
                ) : (
                  <div className={m.notifList}>
                    {notifs.map((n) => {
                      const icon =
                        n.type === "message"
                          ? "fa-comment"
                          : n.type === "enroll"
                          ? "fa-graduation-cap"
                          : "fa-user-plus";
                      const text =
                        n.type === "message"
                          ? t("mentorDash.notifMessage", { name: n.actorName })
                          : n.type === "enroll"
                          ? t("mentorDash.notifEnroll", {
                              name: n.actorName,
                              course: n.detail ? tr(n.detail, locale) : "",
                            })
                          : t("mentorDash.notifFollow", { name: n.actorName });
                      return (
                        <div
                          key={n.id}
                          className={`${m.notifRow} ${m[`notif_${n.type}`]}`}
                        >
                          <span className={m.notifIcon}>
                            <i className={`fa ${icon}`}></i>
                          </span>
                          <div className={m.notifBody}>
                            <span>{text}</span>
                            <time>
                              {new Date(n.date).toLocaleString(
                                locale === "ar" ? "ar-DZ-u-nu-latn" : locale,
                                { dateStyle: "medium", timeStyle: "short" }
                              )}
                            </time>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* -------- Profile -------- */}
            {section === "profile" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.profileTitle")}</h1>
                  <p>{t("mentorDash.profileSub")}</p>
                </div>

                <div className={m.profileCard}>
                  <div className={m.profileTop}>
                    <img className={m.profileAvatar} src={meAvatar} alt={meName} />
                    <div>
                      <b>{meName}</b>
                      <span>{pTitle || meTitle}</span>
                    </div>
                  </div>

                  <form className={m.profileForm} onSubmit={saveProfile}>
                    {/* About you */}
                    <span className={m.sectionLabel}>{t("mentorDash.aboutLabel")}</span>
                    <label className={m.field}>
                      <span>{t("mentorDash.headlineLabel")}</span>
                      <input
                        type="text"
                        value={pTitle}
                        onChange={(e) => setPTitle(e.target.value)}
                        placeholder={t("mentorDash.headlinePh")}
                      />
                    </label>
                    <label className={m.field}>
                      <span>{t("mentorDash.bioLabel")}</span>
                      <textarea value={pBio} onChange={(e) => setPBio(e.target.value)} rows={4} />
                    </label>

                    {/* Details */}
                    <span className={m.sectionLabel}>{t("mentorDash.detailsLabel")}</span>
                    <div className={m.fieldRow}>
                      <label className={m.field}>
                        <span>{t("mentorDash.fieldLabel")}</span>
                        <input type="text" value={pMajor} onChange={(e) => setPMajor(e.target.value)} />
                      </label>
                      <label className={m.field}>
                        <span>{t("mentorDash.levelLabel")}</span>
                        <input type="text" value={pLevel} onChange={(e) => setPLevel(e.target.value)} />
                      </label>
                    </div>
                    <div className={m.fieldRow}>
                      <label className={m.field}>
                        <span>{t("mentorDash.expYearsLabel")}</span>
                        <input
                          type="number"
                          value={pExp}
                          onChange={(e) => setPExp(e.target.value)}
                          min={0}
                        />
                      </label>
                      <label className={m.field}>
                        <span>{t("mentorDash.phoneLabel")}</span>
                        <input type="tel" value={pPhone} onChange={(e) => setPPhone(e.target.value)} />
                      </label>
                    </div>

                    {/* Skills */}
                    <span className={m.sectionLabel}>{t("mentorDash.subjectsLabel")}</span>
                    {pSkills.length > 0 && (
                      <div className={m.tags}>
                        {pSkills.map((tag) => (
                          <span key={tag} className={m.tag}>
                            {tr(tag, locale)}
                            <button
                              type="button"
                              onClick={() => removeSkill(tag)}
                              aria-label={t("mentorDash.remove")}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={m.addRow}>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder={t("mentorDash.skillPh")}
                      />
                      <button type="button" className={m.addLineBtn} onClick={addSkill}>
                        {t("mentorDash.add")}
                      </button>
                    </div>

                    {/* Certifications */}
                    <span className={m.sectionLabel}>{t("mentorDash.certsLabel")}</span>
                    <div className={m.lineList}>
                      {pCerts.map((c, i) => (
                        <div key={i} className={m.certRow}>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => updateCert(i, { name: e.target.value })}
                            placeholder={t("mentorDash.certNamePh")}
                          />
                          <input
                            type="text"
                            value={c.issuer}
                            onChange={(e) => updateCert(i, { issuer: e.target.value })}
                            placeholder={t("mentorDash.certIssuerPh")}
                          />
                          <input
                            type="number"
                            className={m.yearInput}
                            value={c.year}
                            onChange={(e) =>
                              updateCert(i, { year: parseInt(e.target.value, 10) || 0 })
                            }
                          />
                          <button
                            type="button"
                            className={m.removeLineBtn}
                            onClick={() => removeCert(i)}
                            aria-label={t("mentorDash.remove")}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className={m.addLineBtn} onClick={addCert}>
                      <i className="fa fa-plus"></i> {t("mentorDash.addCert")}
                    </button>

                    {/* Achievements */}
                    <span className={m.sectionLabel}>{t("mentorDash.achievementsLabel")}</span>
                    {pAch.length > 0 && (
                      <div className={m.lineList}>
                        {pAch.map((a, i) => (
                          <div key={i} className={m.achRow}>
                            <i className="fa fa-trophy"></i>
                            <span>{tr(a, locale)}</span>
                            <button
                              type="button"
                              className={m.removeLineBtn}
                              onClick={() => removeAchievement(i)}
                              aria-label={t("mentorDash.remove")}
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={m.addRow}>
                      <input
                        type="text"
                        value={achInput}
                        onChange={(e) => setAchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addAchievement();
                          }
                        }}
                        placeholder={t("mentorDash.achievementPh")}
                      />
                      <button type="button" className={m.addLineBtn} onClick={addAchievement}>
                        {t("mentorDash.add")}
                      </button>
                    </div>

                    {/* Teaching (dashboard-only) */}
                    <span className={m.sectionLabel}>{t("mentorDash.teachingLabel")}</span>
                    <div className={m.fieldRow}>
                      <label className={m.field}>
                        <span>{t("mentorDash.rateLabel")}</span>
                        <input
                          type="number"
                          value={pRate}
                          onChange={(e) => setPRate(e.target.value)}
                          min={0}
                        />
                      </label>
                      <label className={m.field}>
                        <span>{t("mentorDash.availabilityLabel")}</span>
                        <input
                          type="text"
                          value={pAvail}
                          onChange={(e) => setPAvail(e.target.value)}
                        />
                      </label>
                    </div>

                    <div className={m.profileActions}>
                      <button
                        type="button"
                        className={m.previewBtn}
                        onClick={() => setShowPreview(true)}
                      >
                        <i className="fa fa-eye"></i> {t("mentorDash.previewProfile")}
                      </button>
                      <button type="submit" className={m.saveBtn}>
                        {t("mentorDash.saveProfile")}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ===== "View as a student" profile preview =====
          A full-screen overlay that renders the exact student-facing profile
          layout (reusing its CSS module `pv`), fed by the LIVE unsaved form
          state so edits show before saving. */}
      {showPreview && (() => {
        const previewYears = (meTeaching ?? []).flatMap((te) => te.years);
        return (
          <div className={m.previewOverlay}>
            <div className={m.previewBar}>
              <span>
                <i className="fa fa-eye"></i> {t("mentorDash.previewNote")}
              </span>
              <button type="button" onClick={() => setShowPreview(false)}>
                <i className="fa fa-times"></i> {t("mentorDash.exitPreview")}
              </button>
            </div>

            <div className={m.previewScroll}>
              {/* Profile header — mirrors /mentors/[id] */}
              <section className={pv.profileHeader}>
                <div className="container">
                  <div className={pv.headerInner}>
                    <div className={pv.headerAvatar}>
                      <img src={meAvatar} alt={meName} />
                    </div>
                    <div className={pv.headerText}>
                      <h1>{meName}</h1>
                      <p className={pv.headerTitle}>{pTitle || meTitle}</p>
                      <div className={pv.headerRating}>
                        <span className={pv.stars}>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star-half-o"></i>
                        </span>
                        4.5 · 128 {t("mentorDetail.reviews")} ·{" "}
                        {pExp || meExperience} {t("mentorDetail.yearsExperience")}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className={pv.wrap}>
                <div className="container">
                  <div className={pv.layout}>
                    {/* Sidebar */}
                    <aside className={pv.sidebar}>
                      <div className={pv.card}>
                        <h3>{t("mentorDetail.contact")}</h3>
                        <div className={pv.contactList}>
                          <p>
                            <i className="fa fa-envelope"></i> {meEmail}
                          </p>
                          <p>
                            <i className="fa fa-phone"></i> {pPhone || mePhone}
                          </p>
                          <p>
                            <i className="fa fa-map-marker"></i> {t("mentorDetail.location")}
                          </p>
                        </div>
                      </div>

                      <div className={pv.card}>
                        <h3>{t("mentorDetail.details")}</h3>
                        <div className={pv.infoRow}>
                          <span>{t("mentorDetail.major")}</span>
                          <span>{tr(pMajor, locale)}</span>
                        </div>
                        <div className={pv.infoRow}>
                          <span>{t("mentorDetail.level")}</span>
                          <span>{tr(pLevel, locale)}</span>
                        </div>
                        <div className={pv.infoRow}>
                          <span>{t("mentorDetail.experience")}</span>
                          <span>{pExp} {t("mentorDetail.years")}</span>
                        </div>
                        {previewYears.length > 0 && (
                          <div className={pv.infoRow}>
                            <span>{t("mentorDetail.teaches")}</span>
                            <span>{previewYears.join(", ")}</span>
                          </div>
                        )}
                        <div className={pv.infoRow}>
                          <span>{t("mentorDetail.coursesWord")}</span>
                          <span>{courses.length}</span>
                        </div>
                      </div>

                      <div className={pv.card}>
                        <h3>{t("mentorDetail.skills")}</h3>
                        <div className={pv.skillTags}>
                          {pSkills.map((sk) => (
                            <span key={sk} className={pv.skillTag}>
                              {tr(sk, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </aside>

                    {/* Main */}
                    <main className={pv.main}>
                      <div className={pv.panel}>
                        <h2 className={pv.sectionTitle}>{t("mentorDetail.aboutMe")}</h2>
                        <p className={pv.aboutText}>{pBio}</p>
                      </div>

                      {/* Intro / recorded-lessons player — example media (kept as-is,
                          real uploads land with the backend). */}
                      {account.previewVideo && (
                        <div className={pv.panel}>
                          <h2 className={pv.sectionTitle}>
                            {t("mentorDetail.previewTitle")}
                          </h2>
                          <MentorMedia
                            poster={account.previewPoster}
                            video={account.previewVideo}
                            lessons={account.lessons.map((l) => ({
                              ...l,
                              title: tr(l.title, locale),
                            }))}
                          />
                        </div>
                      )}

                      <div className={pv.panel}>
                        <h2 className={pv.sectionTitle}>
                          {t("mentorDetail.certifications")}
                        </h2>
                        <div className={pv.certGrid}>
                          {pCerts.map((c, i) => (
                            <div className={pv.certCard} key={i}>
                              <div className={pv.certIcon}>
                                <i className="fa fa-graduation-cap"></i>
                              </div>
                              <div>
                                <div className={pv.certName}>{c.name}</div>
                                <div className={pv.certIssuer}>
                                  {c.issuer} ·{" "}
                                  <span className={pv.certYear}>{c.year}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={pv.panel}>
                        <h2 className={pv.sectionTitle}>
                          {t("mentorDetail.achievements")}
                        </h2>
                        <div className={pv.achList}>
                          {pAch.map((a, i) => (
                            <div className={pv.achItem} key={i}>
                              <i className="fa fa-trophy"></i>
                              {tr(a, locale)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* My Courses — the mentor's real saved courses */}
                      <div className={pv.panel}>
                        <h2 className={pv.sectionTitle}>{t("mentorDetail.myCourses")}</h2>
                        {courses.length > 0 ? (
                          <div className={pv.tableWrap}>
                            <table className={pv.coursesTable}>
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
                                {courses.map((course) => (
                                  <tr key={course.id}>
                                    <td>{tr(course.subject, locale)}</td>
                                    <td>{tr(course.level, locale)}</td>
                                    <td>{formatDate(course.date, locale)}</td>
                                    <td className={pv.price}>
                                      {formatDZD(course.price, locale)}
                                    </td>
                                    <td>
                                      <span className={pv.tableBtn}>
                                        {t("mentorDetail.view")}{" "}
                                        <i className="fa fa-arrow-right"></i>
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className={pv.aboutText}>{t("mentorDetail.noCourses")}</p>
                        )}
                      </div>
                    </main>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== Course editor modal ===== */}
      {editing && (
        <div className={shared.overlay} onClick={() => setEditing(null)}>
          <div className={m.formModal} onClick={(e) => e.stopPropagation()}>
            <div className={m.formHead}>
              <h3>
                {editing === "new"
                  ? t("mentorDash.newCourseTitle")
                  : t("mentorDash.editCourseTitle")}
              </h3>
              <button className={m.closeX} onClick={() => setEditing(null)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form className={`${m.profileForm} ${m.formScroll}`} onSubmit={saveCourse}>
              {/* Course details */}
              <span className={m.sectionLabel}>{t("mentorDash.basicsLabel")}</span>
              <label className={m.field}>
                <span>{t("mentorDash.fSubject")}</span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={t("mentorDash.fSubjectPh")}
                  required
                />
              </label>
              <label className={m.field}>
                <span>{t("mentorDash.fDescription")}</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("mentorDash.fDescriptionPh")}
                />
              </label>
              <div className={m.fieldRow}>
                <label className={m.field}>
                  <span>{t("mentorDash.fMajor")}</span>
                  <input
                    type="text"
                    value={form.major}
                    onChange={(e) => setForm({ ...form, major: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>{t("mentorDash.fTier")}</span>
                  <select
                    value={form.tier}
                    onChange={(e) =>
                      setForm({ ...form, tier: e.target.value, track: "" })
                    }
                  >
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tr(tier, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={m.fieldRow}>
                <label className={m.field}>
                  <span>{t("mentorDash.fYear")}</span>
                  <select
                    value={form.track}
                    onChange={(e) => setForm({ ...form, track: e.target.value })}
                  >
                    <option value="">{t("mentorDash.fYearNone")}</option>
                    {TRACKS.filter((tk) => tk.tier === form.tier).map((tk) => (
                      <option key={tk.key} value={tk.key}>
                        {tk.code} · {t(`coursesPage.tracks.${tk.key}`)}
                        {tk.exam ? ` (${tk.exam})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={m.field}>
                  <span>{t("mentorDash.fStatus")}</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as CourseInput["status"] })}
                  >
                    <option value="available">{t("mentorDash.statusAvailable")}</option>
                    <option value="upcoming">{t("mentorDash.statusUpcoming")}</option>
                  </select>
                </label>
              </div>

              {/* Schedule */}
              <span className={m.sectionLabel}>{t("mentorDash.scheduleLabel")}</span>
              <div className={m.fieldRow}>
                <label className={m.field}>
                  <span>{t("mentorDash.fDate")}</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </label>
                <label className={m.field}>
                  <span>{t("mentorDash.fTime")}</span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </label>
              </div>

              {/* Pricing */}
              <span className={m.sectionLabel}>{t("mentorDash.pricesLabel")}</span>
              <div className={m.fieldRow}>
                <label className={m.field}>
                  <span>{t("mentorDash.fPriceRecorded")}</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
                <label className={m.field}>
                  <span>{t("mentorDash.fPriceGroup")}</span>
                  <input
                    type="number"
                    value={form.priceGroup}
                    onChange={(e) => setForm({ ...form, priceGroup: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
                <label className={m.field}>
                  <span>{t("mentorDash.fPriceIndividual")}</span>
                  <input
                    type="number"
                    value={form.priceIndividual}
                    onChange={(e) => setForm({ ...form, priceIndividual: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </label>
              </div>

              <div className={m.formActions}>
                <button type="button" className={m.ghostBtn} onClick={() => setEditing(null)}>
                  {t("mentorDash.cancel")}
                </button>
                <button type="submit" className={m.saveBtn}>
                  {t("mentorDash.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete confirm ===== */}
      {deleteTarget && (
        <div className={shared.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={shared.modal} onClick={(e) => e.stopPropagation()}>
            <div className={shared.modalIcon} style={{ color: "#dc3545", background: "rgba(220,53,69,0.1)" }}>
              <i className="fa fa-trash"></i>
            </div>
            <h3>{t("mentorDash.deleteTitle")}</h3>
            <p>{t("mentorDash.deleteText", { subject: courseTitle(deleteTarget) })}</p>
            <div className={shared.modalActions}>
              <button className={shared.ghostBtn} onClick={() => setDeleteTarget(null)}>
                {t("mentorDash.cancel")}
              </button>
              <button className={m.dangerBtn} onClick={confirmDelete}>
                {t("mentorDash.deleteYes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={shared.toast}>{toast}</div>}
    </div>
  );
}
