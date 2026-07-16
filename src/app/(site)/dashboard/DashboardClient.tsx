"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import CourseBanner from "@/components/CourseBanner";
import {
  courses,
  getCourseById,
  getJoinOption,
  formatDZD,
  formatDate,
  Course,
} from "@/data/courses";
import { getMentorById } from "@/data/mentors";
import {
  getStudent,
  isMinor,
  addFunds,
  chargeWallet,
  toggleFollow,
} from "@/lib/student";
import { getEnrollments, addEnrollment, Enrollment } from "@/lib/enrollment";
import {
  getConsentRequests,
  createConsentRequest,
  setConsentStatus,
} from "@/lib/consent";
import { sessionDateFor, formatCountdown, isSoon, DISCOUNTS } from "@/lib/schedule";
import { getThread, sendMessage } from "@/lib/messages";
import styles from "./dashboard.module.css";

type Mentor = NonNullable<ReturnType<typeof getMentorById>>;
type Section =
  | "overview"
  | "courses"
  | "mentors"
  | "calendar"
  | "wallet"
  | "notifications";

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "fa-th-large" },
  { key: "courses", label: "My Courses", icon: "fa-book" },
  { key: "mentors", label: "Mentors", icon: "fa-users" },
  { key: "calendar", label: "Schedule", icon: "fa-calendar" },
  { key: "wallet", label: "Wallet", icon: "fa-money" },
  { key: "notifications", label: "Notifications", icon: "fa-bell" },
];

const TOPUP_AMOUNTS = [1000, 2000, 5000];

export default function DashboardClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [section, setSection] = useState<Section>("overview");
  const [base] = useState(() => Date.now());

  const [buyTarget, setBuyTarget] = useState<Course | null>(null);
  const [msgMentor, setMsgMentor] = useState<number | null>(null);
  const [msgText, setMsgText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

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

  const reload = () => setTick((t) => t + 1);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

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

  const pendingConsent = consent.filter((c) => c.status === "pending");

  const notifications = [
    ...sessions
      .filter((s) => isSoon(s.date, base))
      .map((s) => ({
        id: "s" + s.course.id,
        icon: "fa-clock-o",
        accent: "#534ab7",
        title: `${s.course.subject} starts ${formatCountdown(s.date, base)}`,
        text: `with ${getMentorById(s.course.mentorId)?.name ?? ""}`,
        tag: "",
      })),
    ...pendingConsent.map((c) => ({
      id: "c" + c.id,
      icon: "fa-shield",
      accent: "#e0894a",
      title: "Waiting for parental approval",
      text: `${c.courseName} · ${formatDZD(c.amount)} — sent to ${c.parentEmail}`,
      tag: "",
    })),
    ...DISCOUNTS.map((d) => ({
      id: "d" + d.id,
      icon: "fa-tag",
      accent: d.accent,
      title: d.title,
      text: d.text,
      tag: d.tag,
    })),
  ];

  const nextSession = sessions[0];

  // deterministic mock progress per course
  const progressFor = (id: number) => 15 + ((id * 27) % 80);

  const priceOf = (c: Course) => getJoinOption(c, "recorded").price;

  // ----- actions -----
  const confirmBuy = () => {
    const c = buyTarget;
    if (!c) return;
    const price = priceOf(c);
    if (student.balance < price) {
      setBuyTarget(null);
      showToast("Insufficient wallet balance — top up first.");
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
      showToast(`Approval request emailed to ${student.parentEmail}.`);
      return;
    }
    chargeWallet(price, `Course · ${c.subject}`);
    addEnrollment({
      courseId: c.id,
      mode: "recorded",
      ref: "WAL-" + c.id,
      date: new Date().toISOString(),
    });
    setBuyTarget(null);
    reload();
    showToast(`Enrolled in ${c.subject}.`);
  };

  const approveConsent = (reqId: string) => {
    const req = consent.find((r) => r.id === reqId);
    if (!req) return;
    if (!chargeWallet(req.amount, `Course · ${req.courseName}`)) {
      showToast("Insufficient balance to approve.");
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
    showToast("Approved — course unlocked.");
  };

  const denyConsent = (reqId: string) => {
    setConsentStatus(reqId, "denied");
    reload();
    showToast("Request denied.");
  };

  const topUp = (amount: number) => {
    addFunds(amount, "Wallet top-up · BaridiMob");
    reload();
    showToast(`${formatDZD(amount)} added to your wallet.`);
  };

  const follow = (id: number) => {
    toggleFollow(id);
    reload();
  };

  const send = () => {
    if (!msgMentor || !msgText.trim()) return;
    sendMessage(msgMentor, msgText.trim());
    setMsgText("");
    reload();
  };

  const thread = msgMentor ? getThread(msgMentor) : [];
  const activeMentor = msgMentor ? getMentorById(msgMentor) : null;

  if (!mounted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.skeleton}>Loading your dashboard…</div>
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
              <div className={styles.pGrade}>{student.grade}</div>
            </div>

            <div className={styles.walletMini}>
              <span className={styles.wmLabel}>Wallet balance</span>
              <span className={styles.wmValue}>{formatDZD(student.balance)}</span>
            </div>

            <nav className={styles.nav}>
              {NAV.map((item) => {
                const count =
                  item.key === "notifications"
                    ? notifications.length
                    : item.key === "courses"
                    ? enrolledCourses.length
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
                    <span>{item.label}</span>
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
                  <h1>Welcome back, {student.name.split(" ")[0]} 👋</h1>
                  <p>Here&apos;s what&apos;s happening with your learning.</p>
                </div>

                <div className={styles.statGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-book"></i>
                    </span>
                    <span className={styles.statValue}>{enrolledCourses.length}</span>
                    <span className={styles.statLabel}>Enrolled courses</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#1d9e75" }}>
                      <i className="fa fa-users"></i>
                    </span>
                    <span className={styles.statValue}>{followedMentors.length}</span>
                    <span className={styles.statLabel}>Mentors followed</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#e0894a" }}>
                      <i className="fa fa-money"></i>
                    </span>
                    <span className={styles.statValue}>{formatDZD(student.balance)}</span>
                    <span className={styles.statLabel}>Wallet balance</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon} style={{ color: "#534ab7" }}>
                      <i className="fa fa-bell"></i>
                    </span>
                    <span className={styles.statValue}>{notifications.length}</span>
                    <span className={styles.statLabel}>Notifications</span>
                  </div>
                </div>

                {nextSession && (
                  <div className={styles.nextCard}>
                    <div className={styles.nextLeft}>
                      <span className={styles.nextEyebrow}>
                        <i className="fa fa-clock-o"></i> Next session
                      </span>
                      <h3>{nextSession.course.subject}</h3>
                      <p>
                        with {getMentorById(nextSession.course.mentorId)?.name} ·{" "}
                        {formatDate(nextSession.date.toISOString().slice(0, 10))}
                      </p>
                    </div>
                    <div className={styles.nextCountdown}>
                      {formatCountdown(nextSession.date, base)}
                    </div>
                  </div>
                )}

                {pendingConsent.length > 0 && (
                  <div className={styles.consentPanel}>
                    <h3 className={styles.blockTitle}>
                      <i className="fa fa-shield"></i> Parental approvals
                    </h3>
                    {pendingConsent.map((c) => (
                      <div key={c.id} className={styles.consentItem}>
                        <div>
                          <b>{c.courseName}</b> · {formatDZD(c.amount)}
                          <div className={styles.consentMeta}>
                            Emailed to {c.parentEmail} — awaiting decision
                          </div>
                        </div>
                        <div className={styles.consentActions}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => approveConsent(c.id)}
                          >
                            Approve
                          </button>
                          <button
                            className={styles.denyBtn}
                            onClick={() => denyConsent(c.id)}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className={styles.simNote}>
                      Simulated parent view — in the real app your parent receives
                      the email and taps approve or deny.
                    </p>
                  </div>
                )}

                <h3 className={styles.blockTitle}>Recommended for you</h3>
                <div className={styles.recoGrid}>
                  {recommended.map((c) => (
                    <div key={c.id} className={styles.recoCard}>
                      <div className={styles.recoThumb}>
                        <CourseBanner subject={c.major} seed={c.id} />
                      </div>
                      <div className={styles.recoBody}>
                        <b>{c.subject}</b>
                        <span className={styles.recoMeta}>
                          {getMentorById(c.mentorId)?.name}
                        </span>
                        <div className={styles.recoFoot}>
                          <span className={styles.recoPrice}>{formatDZD(priceOf(c))}</span>
                          <Link href={`/courses/${c.id}`} className={styles.recoLink}>
                            View
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
                  <h1>My Courses</h1>
                  <p>{enrolledCourses.length} enrolled · pick up where you left off.</p>
                </div>
                {enrolledCourses.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-book"></i>
                    <p>You haven&apos;t enrolled in any course yet.</p>
                    <Link href="/courses" className={styles.primaryBtn}>
                      Browse courses
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
                            <b>{course.subject}</b>
                            <span className={styles.ciMode}>{e.mode}</span>
                          </div>
                          <span className={styles.ciMentor}>
                            {getMentorById(course.mentorId)?.name} · {course.tier}
                          </span>
                          <div className={styles.progressRow}>
                            <div className={styles.progressTrack}>
                              <span
                                className={styles.progressBar}
                                style={{ width: `${progressFor(course.id)}%` }}
                              ></span>
                            </div>
                            <span className={styles.progressPct}>
                              {progressFor(course.id)}%
                            </span>
                          </div>
                          <span className={styles.ciNext}>
                            <i className="fa fa-clock-o"></i> Next session{" "}
                            {formatCountdown(date, base)}
                          </span>
                        </div>
                        <Link
                          href={`/courses/${course.id}#learn`}
                          className={styles.continueBtn}
                        >
                          Continue <i className="fa fa-play"></i>
                        </Link>
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
                  <h1>Mentors you follow</h1>
                  <p>Message them directly or explore their courses.</p>
                </div>
                {followedMentors.length === 0 ? (
                  <div className={styles.empty}>
                    <i className="fa fa-users"></i>
                    <p>You&apos;re not following any mentor yet.</p>
                    <Link href="/mentors" className={styles.primaryBtn}>
                      Find mentors
                    </Link>
                  </div>
                ) : (
                  <div className={styles.mentorList}>
                    {followedMentors.map((m) => (
                      <div key={m.id} className={styles.mentorItem}>
                        <img
                          className={styles.mAvatar}
                          src={m.profilePicture}
                          alt={m.name}
                        />
                        <div className={styles.mInfo}>
                          <b>{m.name}</b>
                          <span className={styles.mMajor}>{m.major}</span>
                        </div>
                        <div className={styles.mActions}>
                          <button
                            className={styles.msgBtn}
                            onClick={() => {
                              setMsgMentor(m.id);
                              setMsgText("");
                            }}
                          >
                            <i className="fa fa-comment"></i> Message
                          </button>
                          <Link href={`/mentors/${m.id}`} className={styles.viewBtn}>
                            Profile
                          </Link>
                          <button
                            className={styles.unfollowBtn}
                            onClick={() => follow(m.id)}
                            title="Unfollow"
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
                  <h1>Schedule</h1>
                  <p>Your upcoming sessions and suggestions.</p>
                </div>

                <h3 className={styles.blockTitle}>Upcoming sessions</h3>
                {sessions.length === 0 ? (
                  <p className={styles.muted}>No sessions scheduled yet.</p>
                ) : (
                  <div className={styles.agenda}>
                    {sessions.map(({ course, date }) => (
                      <div key={course.id} className={styles.agendaItem}>
                        <div className={styles.agDate}>
                          <span className={styles.agDay}>{date.getDate()}</span>
                          <span className={styles.agMonth}>
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </div>
                        <div className={styles.agInfo}>
                          <b>{course.subject}</b>
                          <span>
                            {getMentorById(course.mentorId)?.name} ·{" "}
                            {date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className={styles.countdownBadge}>
                          {formatCountdown(date, base)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className={styles.blockTitle}>Suggested — not enrolled yet</h3>
                <div className={styles.agenda}>
                  {recommended.map((c) => (
                    <div key={c.id} className={`${styles.agendaItem} ${styles.agendaGhost}`}>
                      <div className={styles.agDate}>
                        <span className={styles.agDay}>
                          {new Date(c.date + "T00:00:00").getDate()}
                        </span>
                        <span className={styles.agMonth}>
                          {new Date(c.date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className={styles.agInfo}>
                        <b>{c.subject}</b>
                        <span>
                          {getMentorById(c.mentorId)?.name} · {formatDZD(priceOf(c))}
                        </span>
                      </div>
                      <button className={styles.walletBuyBtn} onClick={() => setBuyTarget(c)}>
                        Pay with wallet
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
                  <h1>Wallet</h1>
                  <p>Top up once, then enroll in a tap — no card needed each time.</p>
                </div>

                <div className={styles.walletCard}>
                  <span className={styles.wcLabel}>Available balance</span>
                  <span className={styles.wcBalance}>{formatDZD(student.balance)}</span>
                  <div className={styles.topupRow}>
                    {TOPUP_AMOUNTS.map((a) => (
                      <button key={a} className={styles.topupBtn} onClick={() => topUp(a)}>
                        + {formatDZD(a)}
                      </button>
                    ))}
                  </div>
                  <span className={styles.wcHint}>
                    <i className="fa fa-info-circle"></i> Top up via BaridiMob or
                    CIB/Edahabia card.
                  </span>
                </div>

                <h3 className={styles.blockTitle}>Buy a course from your balance</h3>
                <div className={styles.recoGrid}>
                  {recommended.map((c) => (
                    <div key={c.id} className={styles.recoCard}>
                      <div className={styles.recoThumb}>
                        <CourseBanner subject={c.major} seed={c.id} />
                      </div>
                      <div className={styles.recoBody}>
                        <b>{c.subject}</b>
                        <span className={styles.recoMeta}>
                          {getMentorById(c.mentorId)?.name}
                        </span>
                        <div className={styles.recoFoot}>
                          <span className={styles.recoPrice}>{formatDZD(priceOf(c))}</span>
                          <button
                            className={styles.walletBuyBtn}
                            onClick={() => setBuyTarget(c)}
                          >
                            Pay from wallet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className={styles.blockTitle}>Transactions</h3>
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
                        <b>{tx.label}</b>
                        <span>{formatDate(tx.date.slice(0, 10))}</span>
                      </div>
                      <span
                        className={tx.type === "topup" ? styles.txPos : styles.txNeg}
                      >
                        {tx.type === "topup" ? "+" : "−"}
                        {formatDZD(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* -------- Notifications -------- */}
            {section === "notifications" && (
              <section>
                <div className={styles.panelHead}>
                  <h1>Notifications</h1>
                  <p>Session reminders, approvals, and offers.</p>
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
                        <span
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

      {/* ===== Confirm purchase dialog ===== */}
      {buyTarget && (
        <div className={styles.overlay} onClick={() => setBuyTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <i className="fa fa-question-circle"></i>
            </div>
            <h3>Are you sure?</h3>
            <p>
              Pay <b>{formatDZD(priceOf(buyTarget))}</b> from your wallet for{" "}
              <b>{buyTarget.subject}</b>?
            </p>
            {isMinor(student) && (
              <p className={styles.consentNote}>
                <i className="fa fa-shield"></i> You&apos;re under 18 — we&apos;ll
                email {student.parentEmail} for approval before charging.
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={() => setBuyTarget(null)}>
                Cancel
              </button>
              <button className={styles.primaryBtn} onClick={confirmBuy}>
                {isMinor(student) ? "Request approval" : "Confirm & pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Message mentor dialog ===== */}
      {msgMentor && activeMentor && (
        <div className={styles.overlay} onClick={() => setMsgMentor(null)}>
          <div className={styles.msgModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.msgHead}>
              <img src={activeMentor.profilePicture} alt={activeMentor.name} />
              <div>
                <b>{activeMentor.name}</b>
                <span>{activeMentor.major}</span>
              </div>
              <button className={styles.closeX} onClick={() => setMsgMentor(null)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className={styles.msgThread}>
              {thread.length === 0 ? (
                <p className={styles.msgEmpty}>
                  Start the conversation with {activeMentor.name.split(" ")[0]}.
                </p>
              ) : (
                thread.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.bubble} ${
                      m.from === "student" ? styles.bubbleMine : styles.bubbleTheirs
                    }`}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>
            <div className={styles.msgComposer}>
              <input
                type="text"
                placeholder="Write a message…"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button onClick={send} disabled={!msgText.trim()}>
                <i className="fa fa-paper-plane"></i>
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
