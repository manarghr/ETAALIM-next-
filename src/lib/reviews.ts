// Course reviews (rating + text), localStorage-backed. Each course is seeded
// with a couple of deterministic demo reviews so the section never looks empty;
// the student's own reviews are appended and persisted.
import { students } from "@/data/students";

export interface Review {
  id: string;
  author: string;
  /** directory id of the reviewing student (seeded reviews) — lets the admin open their profile */
  studentId?: string;
  rating: number; // 1–5
  textKey?: string; // seeded reviews translate via i18n
  text?: string; // user-written reviews (as typed)
  date: string; // ISO
  seeded?: boolean;
}

const KEY = "etaalim.reviews";

const SEED_TEXT_KEYS = [
  "review.seed1",
  "review.seed2",
  "review.seed3",
  "review.seed4",
];

function seedFor(courseId: number): Review[] {
  // 2–3 seeded reviews, deterministic per course, written by real students
  // from the directory — preferably ones actually enrolled in the course.
  const enrolled = students.filter((s) => s.enrolledCourseIds.includes(courseId));
  const pool = enrolled.length > 0 ? enrolled : students;
  const count = Math.min(2 + (courseId % 2), pool.length);
  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    // step by i (not a multiple) so small pools never repeat a reviewer
    const st = pool[(courseId * 7 + i) % pool.length];
    const k = (courseId * 5 + i) % SEED_TEXT_KEYS.length;
    out.push({
      id: `seed-${courseId}-${i}`,
      author: st.name,
      studentId: st.id,
      rating: 4 + ((courseId + i) % 2), // 4 or 5
      textKey: SEED_TEXT_KEYS[k],
      date: new Date(2026, 5, 1 + ((courseId + i) % 27)).toISOString(),
      seeded: true,
    });
  }
  return out;
}

type Store = Record<number, Review[]>;

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

/** Seeded reviews first (oldest), then the user's, newest user review on top. */
export function getReviews(courseId: number): Review[] {
  const stored = readAll()[courseId] ?? [];
  return [...seedFor(courseId), ...stored].sort((a, b) => {
    if (a.seeded && !b.seeded) return 1; // user reviews above seeds
    if (!a.seeded && b.seeded) return -1;
    return b.date.localeCompare(a.date);
  });
}

export function addReview(
  courseId: number,
  author: string,
  rating: number,
  text: string
): Review[] {
  const all = readAll();
  const list = all[courseId] ?? [];
  list.push({
    id: uid(),
    author,
    rating,
    text,
    date: new Date().toISOString(),
  });
  all[courseId] = list;
  writeAll(all);
  return getReviews(courseId);
}

export function averageRating(courseId: number): number {
  const all = getReviews(courseId);
  if (all.length === 0) return 0;
  return all.reduce((s, r) => s + r.rating, 0) / all.length;
}

export function reviewCount(courseId: number): number {
  return getReviews(courseId).length;
}
