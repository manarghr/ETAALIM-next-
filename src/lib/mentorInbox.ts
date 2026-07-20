// Mentor inbox: conversations with students, localStorage-backed. Seeded with a
// few student threads (translated via i18n keys) so the inbox looks alive; the
// mentor's replies and any new turns are stored as typed. Mock until Supabase.
import { getRoster } from "@/data/roster";
import { getCoursesByMentor } from "@/data/courses";

export interface InboxMessage {
  id: string;
  from: "student" | "mentor";
  textKey?: string; // seeded messages translate via i18n
  text?: string; // typed messages (mentor replies) shown as-is
  date: string; // ISO
}

export interface InboxThread {
  studentId: string;
  studentName: string;
  initials: string;
  messages: InboxMessage[];
}

const KEY = "etaalim.mentorInbox";
type Store = Record<number, InboxThread[]>;

const SEED_QUESTION_KEYS = [
  "mentorDash.inboxSeed1",
  "mentorDash.inboxSeed2",
  "mentorDash.inboxSeed3",
  "mentorDash.inboxSeed4",
];

function seedFor(mentorId: number): InboxThread[] {
  // Pull a few students from the mentor's first course roster.
  const course = getCoursesByMentor(mentorId)[0];
  const roster = course ? getRoster(course.id).slice(0, 4) : [];
  return roster.map((s, i) => ({
    studentId: s.id,
    studentName: s.name,
    initials: s.initials,
    messages: [
      {
        id: `seed-${s.id}`,
        from: "student" as const,
        textKey: SEED_QUESTION_KEYS[i % SEED_QUESTION_KEYS.length],
        date: new Date(2026, 6, 10 + i, 9 + i).toISOString(),
      },
    ],
  }));
}

function readAll(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeAll(s: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getInbox(mentorId: number): InboxThread[] {
  const all = readAll();
  if (!all[mentorId]) {
    all[mentorId] = seedFor(mentorId);
    writeAll(all);
  }
  return all[mentorId];
}

export function replyToThread(
  mentorId: number,
  studentId: string,
  text: string
): InboxThread[] {
  const all = readAll();
  const list = all[mentorId] ?? seedFor(mentorId);
  const thread = list.find((t) => t.studentId === studentId);
  if (thread) {
    thread.messages.push({
      id: uid(),
      from: "mentor",
      text,
      date: new Date().toISOString(),
    });
  }
  all[mentorId] = list;
  writeAll(all);
  return all[mentorId];
}

/** Threads whose last message is from a student (i.e. awaiting a reply). */
export function unreadCount(mentorId: number): number {
  return getInbox(mentorId).filter((t) => {
    const last = t.messages[t.messages.length - 1];
    return last && last.from === "student";
  }).length;
}
