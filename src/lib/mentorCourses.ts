// The mentor's own course list, editable (create/edit/delete), localStorage-
// backed. Seeds from the mentor's real catalog courses on first load; new
// courses the mentor creates carry a free-text subject. Fields mirror the
// platform's Course model so the editor matches how courses appear site-wide.
// Mock until the backend.
import { getCoursesByMentor } from "@/data/courses";
import { getRoster } from "@/data/roster";

export interface CourseInput {
  subject: string;
  description: string;
  major: string;
  tier: string;
  level: string;
  date: string; // yyyy-mm-dd (start date)
  time: string; // HH:MM (24h)
  price: number; // self-paced / recorded (DZD)
  priceGroup: number; // online group session (DZD)
  priceIndividual: number; // 1-on-1 session (DZD)
  status: "available" | "upcoming";
}

export interface MentorCourse extends CourseInput {
  id: number;
  students: number;
  /** true when the mentor created it (subject shown as typed, not translated) */
  custom?: boolean;
}

const KEY = "etaalim.mentorCourses";
type Store = Record<number, MentorCourse[]>;

function seedFor(mentorId: number): MentorCourse[] {
  return getCoursesByMentor(mentorId).map((c) => ({
    id: c.id,
    subject: c.subject,
    description: "",
    major: c.major,
    tier: c.tier,
    level: c.level,
    date: c.date,
    time: c.time,
    price: c.price,
    priceGroup: c.priceGroup,
    priceIndividual: c.priceIndividual,
    status: c.status,
    students: getRoster(c.id).length,
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

export function getMentorCourses(mentorId: number): MentorCourse[] {
  const all = readAll();
  if (!all[mentorId]) {
    all[mentorId] = seedFor(mentorId);
    writeAll(all);
  }
  return all[mentorId];
}

export function addCourse(mentorId: number, input: CourseInput): MentorCourse[] {
  const all = readAll();
  const list = all[mentorId] ?? seedFor(mentorId);
  list.unshift({
    id: 1_000_000 + Math.floor(Math.random() * 1_000_000),
    ...input,
    students: 0,
    custom: true,
  });
  all[mentorId] = list;
  writeAll(all);
  return list;
}

export function updateCourse(
  mentorId: number,
  id: number,
  input: Partial<CourseInput>
): MentorCourse[] {
  const all = readAll();
  const list = all[mentorId] ?? seedFor(mentorId);
  all[mentorId] = list.map((c) => (c.id === id ? { ...c, ...input } : c));
  writeAll(all);
  return all[mentorId];
}

export function deleteCourse(mentorId: number, id: number): MentorCourse[] {
  const all = readAll();
  const list = all[mentorId] ?? seedFor(mentorId);
  all[mentorId] = list.filter((c) => c.id !== id);
  writeAll(all);
  return all[mentorId];
}
