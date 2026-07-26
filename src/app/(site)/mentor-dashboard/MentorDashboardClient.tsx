"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { useI18n } from "@/i18n/I18nProvider";
import { tr } from "@/data/localized";
import { TIERS, formatDZD, formatDate } from "@/data/courses";
import { getRoster } from "@/data/roster";
import { sessionDateFor, countdownOf } from "@/lib/schedule";
import {
  getMentorAccount,
  updateMentorProfile,
  totalEarnings,
  monthEarnings,
} from "@/lib/mentor";
import {
  getMentorCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  MentorCourse,
  CourseInput,
} from "@/lib/mentorCourses";
import { getInbox, replyToThread, InboxThread } from "@/lib/mentorInbox";
import { Certificate } from "@/data/mentors";
import MentorMedia from "@/components/MentorMedia";
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
  | "profile";

const NAV: { key: Section; labelKey: string; icon: string }[] = [
  { key: "overview", labelKey: "mentorDash.navOverview", icon: "fa-th-large" },
  { key: "courses", labelKey: "mentorDash.navCourses", icon: "fa-book" },
  { key: "students", labelKey: "mentorDash.navStudents", icon: "fa-users" },
  { key: "schedule", labelKey: "mentorDash.navSchedule", icon: "fa-calendar" },
  { key: "earnings", labelKey: "mentorDash.navEarnings", icon: "fa-money" },
  { key: "messages", labelKey: "mentorDash.navMessages", icon: "fa-comments" },
  { key: "profile", labelKey: "mentorDash.navProfile", icon: "fa-id-card" },
];

const EMPTY_FORM: CourseInput = {
  subject: "",
  description: "",
  major: "",
  tier: "High School",
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

  // Messages
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "mentor") {
      router.replace("/login");
      return;
    }
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
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
  const courses = mounted ? getMentorCourses(mentorId) : [];
  const rating = (4.6 + (mentorId % 4) * 0.1).toFixed(1);

  const roster = courses.flatMap((c) =>
    getRoster(c.id).map((s) => ({ student: s, course: c }))
  );

  const sessions = courses
    .map((c, i) => ({ course: c, date: sessionDateFor(i, base) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const inbox = mounted ? getInbox(mentorId) : [];
  const unread = inbox.filter((tr2) => {
    const last = tr2.messages[tr2.messages.length - 1];
    return last && last.from === "student";
  }).length;

  const earned = mounted ? totalEarnings() : 0;
  const thisMonth = mounted ? monthEarnings() : 0;

  // earnings grouped by course subject
  const byCourse = account.earnings.reduce<Record<string, number>>((acc, tx) => {
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
  const saveCourse = (e: FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    if (editing === "new") {
      addCourse(mentorId, form);
      showToast(t("mentorDash.toastCourseCreated"));
    } else if (editing) {
      updateCourse(mentorId, editing.id, form);
      showToast(t("mentorDash.toastCourseUpdated"));
    }
    setEditing(null);
    reload();
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCourse(mentorId, deleteTarget.id);
    setDeleteTarget(null);
    showToast(t("mentorDash.toastCourseDeleted"));
    reload();
  };

  const thread = inbox.find((th) => th.studentId === activeThread) ?? null;
  const sendReply = () => {
    if (!thread || !replyText.trim()) return;
    replyToThread(mentorId, thread.studentId, replyText.trim());
    setReplyText("");
    showToast(t("mentorDash.toastReplySent"));
    reload();
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

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    updateMentorProfile({
      title: pTitle.trim(),
      bioOverride: pBio,
      major: pMajor.trim(),
      level: pLevel.trim(),
      experience: parseInt(pExp, 10) || 0,
      phone: pPhone.trim(),
      skills: pSkills.join(", "),
      // drop empty certification rows
      certificates: pCerts.filter((c) => c.name.trim() || c.issuer.trim()),
      achievements: pAch,
      hourlyRate: parseInt(pRate, 10) || 0,
      availability: pAvail,
    });
    showToast(t("mentorDash.toastProfileSaved"));
    reload();
  };

  const inboxText = (msg: InboxThread["messages"][number]) =>
    msg.textKey ? t(msg.textKey) : msg.text ?? "";

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
              <img className={m.sideAvatar} src={account.profilePicture} alt={account.name} />
              <div className={shared.pName}>{account.name}</div>
              <div className={shared.pGrade}>{tr(account.major, locale)}</div>
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
                    : item.key === "courses"
                    ? courses.length
                    : item.key === "students"
                    ? roster.length
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
                  <h1>{t("mentorDash.welcome", { name: account.name.split(" ")[0] })}</h1>
                  <p>{t("mentorDash.welcomeSub")}</p>
                </div>

                <div className={shared.statGrid}>
                  <div className={shared.statCard}>
                    <span className={shared.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-users"></i>
                    </span>
                    <span className={shared.statValue}>{roster.length}</span>
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
                <div className={m.studentList}>
                  {roster.slice(0, 5).map(({ student, course }) => (
                    <div key={student.id} className={m.studentRow}>
                      <span className={m.studentAvatar}>{student.initials}</span>
                      <div className={m.studentInfo}>
                        <b>{student.name}</b>
                        <span>{courseTitle(course)}</span>
                      </div>
                      <span className={m.progressChip}>{student.progress}%</span>
                    </div>
                  ))}
                </div>
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
                            <span><i className="fa fa-users"></i> {c.students} {t("mentorDash.studentsWord")}</span>
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
                {roster.length === 0 ? (
                  <p className={shared.muted}>{t("mentorDash.noStudents")}</p>
                ) : (
                  <div className={m.studentList}>
                    {roster.map(({ student, course }) => (
                      <div key={`${course.id}-${student.id}`} className={m.studentRow}>
                        <span className={m.studentAvatar}>{student.initials}</span>
                        <div className={m.studentInfo}>
                          <b>{student.name}</b>
                          <span>{courseTitle(course)}</span>
                        </div>
                        <div className={m.studentRight}>
                          <div className={m.miniTrack}>
                            <span style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className={m.progressChip}>{student.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                <div className={m.txList}>
                  {account.earnings.slice(0, 10).map((tx) => (
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
                            onClick={() => setActiveThread(th.studentId)}
                          >
                            <span className={m.studentAvatar}>{th.initials}</span>
                            <div className={m.threadInfo}>
                              <b>{th.studentName}</b>
                              <span>{inboxText(last)}</span>
                            </div>
                            {last.from === "student" && <span className={m.dot} />}
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
                                {inboxText(msg)}
                              </div>
                            ))}
                          </div>
                          <div className={m.replyBar}>
                            <input
                              type="text"
                              placeholder={t("mentorDash.replyPh")}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && sendReply()}
                            />
                            <button onClick={sendReply} disabled={!replyText.trim()}>
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

            {/* -------- Profile -------- */}
            {section === "profile" && (
              <section>
                <div className={shared.panelHead}>
                  <h1>{t("mentorDash.profileTitle")}</h1>
                  <p>{t("mentorDash.profileSub")}</p>
                </div>

                <div className={m.profileCard}>
                  <div className={m.profileTop}>
                    <img className={m.profileAvatar} src={account.profilePicture} alt={account.name} />
                    <div>
                      <b>{account.name}</b>
                      <span>{pTitle || account.title}</span>
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
        const previewYears = (account.teaching ?? []).flatMap((te) => te.years);
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
                      <img src={account.profilePicture} alt={account.name} />
                    </div>
                    <div className={pv.headerText}>
                      <h1>{account.name}</h1>
                      <p className={pv.headerTitle}>{pTitle || account.title}</p>
                      <div className={pv.headerRating}>
                        <span className={pv.stars}>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star"></i>
                          <i className="fa fa-star-half-o"></i>
                        </span>
                        4.5 · 128 {t("mentorDetail.reviews")} ·{" "}
                        {pExp || account.experience} {t("mentorDetail.yearsExperience")}
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
                            <i className="fa fa-envelope"></i> {account.email}
                          </p>
                          <p>
                            <i className="fa fa-phone"></i> {pPhone || account.phone}
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
                  <span>{t("mentorDash.fLevel")}</span>
                  <input
                    type="text"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    placeholder={t("mentorDash.fLevelPh")}
                  />
                </label>
              </div>
              <div className={m.fieldRow}>
                <label className={m.field}>
                  <span>{t("mentorDash.fTier")}</span>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  >
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tr(tier, locale)}
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
