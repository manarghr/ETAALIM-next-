// The mentor's own course list, backed by the Supabase `courses` table. A course
// carries `mentor_id` (the numeric seed id, for attribution across the catalog)
// and `owner_id` (the mentor's real uuid, which RLS uses so a mentor can only
// edit/delete their own). Courses created here are real catalog rows students
// can find and buy. Fields mirror the platform's Course model.
import { createClient } from "@/lib/supabase/client";

export interface CourseInput {
  subject: string;
  description: string;
  major: string;
  tier: string;
  level: string; // shown in the editor; not stored (mirrors the admin editor)
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

// DB row -> the shape the editor/dashboard expect.
function rowToCourse(r: Record<string, unknown>): MentorCourse {
  return {
    id: r.id as number,
    subject: (r.subject as string) ?? "",
    description: (r.description as string) ?? "",
    major: (r.major as string) ?? "",
    tier: (r.tier as string) ?? "",
    level: (r.year_code as string) ?? (r.level as string) ?? "",
    date: (r.session_date as string) ?? "",
    time: (r.session_time as string) ?? "",
    price: (r.price as number) ?? 0,
    priceGroup: (r.price_group as number) ?? 0,
    priceIndividual: (r.price_individual as number) ?? 0,
    status: (r.status as string) === "upcoming" ? "upcoming" : "available",
    students: 0, // real student counts land with the roster step
    custom: true,
  };
}

// Editor input -> DB columns (only provided fields are written).
function inputToRow(input: Partial<CourseInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.subject !== undefined) row.subject = input.subject;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.major !== undefined) row.major = input.major;
  if (input.tier !== undefined) row.tier = input.tier;
  // The editor's "level" is really the year (e.g. "3AS"); store it as year_code
  // so it shows in the level column and distinguishes the course.
  if (input.level !== undefined) row.year_code = input.level || null;
  if (input.date !== undefined) row.session_date = input.date || null;
  if (input.time !== undefined) row.session_time = input.time || null;
  if (input.price !== undefined) row.price = input.price;
  if (input.priceGroup !== undefined) row.price_group = input.priceGroup;
  if (input.priceIndividual !== undefined) row.price_individual = input.priceIndividual;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

// The courses the current mentor owns, newest first.
export async function getMentorCourses(): Promise<MentorCourse[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("owner_id", user.id)
    .order("id", { ascending: false });
  return (data ?? []).map(rowToCourse);
}

// Create a course owned by the current mentor, attributed to their seed id.
export async function addCourse(
  seedMentorId: number,
  input: CourseInput
): Promise<MentorCourse[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { error } = await supabase
    .from("courses")
    .insert({ ...inputToRow(input), owner_id: user.id, mentor_id: seedMentorId });
  if (error) console.error("addCourse:", error.message);
  return getMentorCourses();
}

export async function updateCourse(
  id: number,
  input: Partial<CourseInput>
): Promise<MentorCourse[]> {
  const supabase = createClient();
  const { error } = await supabase.from("courses").update(inputToRow(input)).eq("id", id);
  if (error) console.error("updateCourse:", error.message);
  return getMentorCourses();
}

export async function deleteCourse(id: number): Promise<MentorCourse[]> {
  const supabase = createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) console.error("deleteCourse:", error.message);
  return getMentorCourses();
}
