// The mentor's students, from real enrollments.
import { createClient } from "@/lib/supabase/client";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** One enrolled student for one of the mentor's courses. */
export interface RosterEntry {
  studentId: string;
  name: string;
  initials: string;
  courseId: number;
  mode: string; // "recorded" | "group" | "individual"
  date: string; // ISO
}

// Every student enrolled in one of the mentor's courses. RLS scopes the
// enrollments to the mentor's own courses; names are joined from `profiles`.
export async function getMentorRoster(): Promise<RosterEntry[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: enr } = await supabase
    .from("enrollments")
    .select("course_id, user_id, mode, created_at")
    .order("created_at", { ascending: false });
  if (!enr || enr.length === 0) return [];

  const ids = [...new Set(enr.map((e) => e.user_id as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", ids);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name as string]));

  return enr.map((e) => {
    const name = nameById.get(e.user_id as string) ?? "Student";
    return {
      studentId: e.user_id as string,
      name,
      initials: initialsOf(name),
      courseId: e.course_id as number,
      mode: (e.mode as string) ?? "recorded",
      date: e.created_at as string,
    };
  });
}

// Returns a map: courseId -> number of enrollments.
export async function getEnrollmentCounts(): Promise<Record<number, number>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  // Thanks to the new RLS policy, this only returns enrollments for the
  // courses this mentor owns.
  const { data } = await supabase
    .from("enrollments")
    .select("course_id");

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    counts[row.course_id] = (counts[row.course_id] ?? 0) + 1;
  }
  return counts;
}

// Live updates: fire `onChange` whenever an enrollment the mentor can see
// changes (RLS scopes realtime to their own courses' enrollments).
export function subscribeEnrollments(onChange: () => void): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("enrollments-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "enrollments" },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}