// Per-course lesson progress, backed by the Supabase `lesson_progress` table.
// One row = one completed lesson (per user, per course). RLS scopes to the user.
import { createClient } from "@/lib/supabase/client";

// Completed lesson ids for one course.
export async function getCompleted(courseId: number): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("course_id", courseId);
  return (data ?? []).map((r) => r.lesson_id as string);
}

// Mark a lesson complete (insert) or incomplete (delete).
export async function setLessonDone(
  courseId: number,
  lessonId: string,
  done: boolean
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (done) {
    await supabase
      .from("lesson_progress")
      .upsert({ user_id: user.id, course_id: courseId, lesson_id: lessonId });
  } else {
    await supabase
      .from("lesson_progress")
      .delete()
      .eq("course_id", courseId)
      .eq("lesson_id", lessonId);
  }
}

// How many lessons the user has completed, per course id.
export async function getProgressCounts(): Promise<Record<number, number>> {
  const supabase = createClient();
  const { data } = await supabase.from("lesson_progress").select("course_id");
  const map: Record<number, number> = {};
  (data ?? []).forEach((r) => {
    const cid = r.course_id as number;
    map[cid] = (map[cid] ?? 0) + 1;
  });
  return map;
}

// 0–100, rounded.
export function pctOf(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(completed, total) / total) * 100);
}
