// Per-course lesson progress, localStorage-backed (mock until the backend
// tracks real completions). Stores the set of completed lesson ids per course.
const KEY = "etaalim.progress";

type Progress = Record<number, string[]>;

function readAll(): Progress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function writeAll(p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function getCompleted(courseId: number): string[] {
  return readAll()[courseId] ?? [];
}

export function isLessonDone(courseId: number, lessonId: string): boolean {
  return getCompleted(courseId).includes(lessonId);
}

/** Mark a lesson complete or not. Returns the updated completed-id list. */
export function setLessonDone(
  courseId: number,
  lessonId: string,
  done: boolean
): string[] {
  const all = readAll();
  const set = new Set(all[courseId] ?? []);
  if (done) set.add(lessonId);
  else set.delete(lessonId);
  all[courseId] = [...set];
  writeAll(all);
  return all[courseId];
}

export function toggleLesson(courseId: number, lessonId: string): string[] {
  return setLessonDone(courseId, lessonId, !isLessonDone(courseId, lessonId));
}

/** 0–100, rounded. `total` is the course's lesson count. */
export function progressPct(courseId: number, total: number): number {
  if (total <= 0) return 0;
  const done = getCompleted(courseId).filter(Boolean).length;
  return Math.round((Math.min(done, total) / total) * 100);
}
