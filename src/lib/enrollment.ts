// Client-side enrollment store. Persists which courses the user has "unlocked"
// in localStorage so the course page reflects it — a stand-in until the backend
// (accounts + real enrollments) lands.
import { createClient } from "@/lib/supabase/client";

export interface Enrollment {
  courseId: number;
  mode: string;
  ref: string;
  date: string; // ISO
}

// The logged-in user's real enrollments from Supabase (RLS returns only theirs).
export async function getMyEnrollments(): Promise<Enrollment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("course_id, mode, ref, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((e) => ({
    courseId: e.course_id,
    mode: e.mode,
    ref: e.ref,
    date: e.created_at,
  }));
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
