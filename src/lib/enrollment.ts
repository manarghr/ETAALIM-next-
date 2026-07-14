// Client-side enrollment store. Persists which courses the user has "unlocked"
// in localStorage so the course page reflects it — a stand-in until the backend
// (accounts + real enrollments) lands.
export interface Enrollment {
  courseId: number;
  mode: string;
  ref: string;
  date: string; // ISO
}

const KEY = "etaalim.enrollments";

function read(): Enrollment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Enrollment[]) : [];
  } catch {
    return [];
  }
}

export function getEnrollments(): Enrollment[] {
  return read();
}

export function isEnrolled(courseId: number): boolean {
  return read().some((e) => e.courseId === courseId);
}

export function addEnrollment(entry: Enrollment): void {
  if (typeof window === "undefined") return;
  const list = read().filter((e) => e.courseId !== entry.courseId);
  list.push(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
