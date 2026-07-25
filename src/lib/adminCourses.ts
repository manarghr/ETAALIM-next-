import { createClient} from "@/lib/supabase/client";
import { getTrack } from "@/data/courses";

export interface AdminCourseInput {
  subject: string;
  description: string;
  major: string;
  tier: string;
  track: string;
  level: string; // kept for the UI; no longer stored in the DB
  price: number;
  priceGroup: number;
  priceIndividual: number;
  date: string;
  time: string;
  status: "available" | "upcoming";
  mentorIds: number[]; // DB stores one mentor; we keep the array shape for the UI
}

export interface AdminCourse extends AdminCourseInput {
  id: number;
  yearCode: string;
  custom?: boolean;
}


const codeOf = (track: string) => getTrack(track)?.code ?? "";
const yearOf = (code: string) => {
  const n = parseInt(code, 10);
  return Number.isFinite(n) ? n : 1;
};


function streamOf(track: string): string | null {
  if (track.startsWith("hs_exp")) return "Experimental Sciences";
  if (track.startsWith("hs_math")) return "Mathematics";
  if (track.startsWith("hs_tech")) return "Technical Mathematics";
  if (track.startsWith("hs_gest")) return "Management & Economics";
  if (track.startsWith("hs_philo")) return "Literature & Philosophy";
  if (track.startsWith("hs_lang")) return "Foreign Languages";
  if (track === "hs_tc_sci") return "Common Core — Science";
  if (track === "hs_tc_let") return "Common Core — Letters";
  return null;
}

// DB row -> AdminCourse (snake_case -> the shape the UI expects)
function rowToAdmin(r: Record<string, unknown>): AdminCourse {
  const track = (r.track as string) ?? "";
  const mentorId = (r.mentor_id as number) ?? 0;
  return {
    id: r.id as number,
    subject: (r.subject as string) ?? "",
    description: (r.description as string) ?? "",
    major: (r.major as string) ?? "",
    tier: (r.tier as string) ?? "",
    track,
    level: "",
    price: (r.price as number) ?? 0,
    priceGroup: (r.price_group as number) ?? 0,
    priceIndividual: (r.price_individual as number) ?? 0,
    date: (r.session_date as string) ?? "",
    time: (r.session_time as string) ?? "",
    status: (r.status as string) === "upcoming" ? "upcoming" : "available",
    mentorIds: mentorId ? [mentorId] : [],
    yearCode: (r.year_code as string) ?? codeOf(track),
  };
}


// AdminCourseInput -> DB columns (only the fields present get written)
function inputToRow(input: Partial<AdminCourseInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.subject !== undefined) row.subject = input.subject;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.major !== undefined) row.major = input.major;
  if (input.tier !== undefined) row.tier = input.tier;
  if (input.track !== undefined) {
    const code = codeOf(input.track);
    row.track = input.track;
    row.year = yearOf(code);
    row.year_code = code;
    row.stream = streamOf(input.track);
  }
  if (input.price !== undefined) row.price = input.price;
  if (input.priceGroup !== undefined) row.price_group = input.priceGroup;
  if (input.priceIndividual !== undefined) row.price_individual = input.priceIndividual;
  if (input.date !== undefined) row.session_date = input.date || null;
  if (input.time !== undefined) row.session_time = input.time || null;
  if (input.status !== undefined) row.status = input.status;
  if (input.mentorIds !== undefined) row.mentor_id = input.mentorIds[0] ?? null;
  return row;
}

export async function getAdminCourses(): Promise<AdminCourse[]> {
  const supabase = createClient();
  const { data } = await supabase.from("courses").select("*").order("id");
  return (data ?? []).map(rowToAdmin);
}

export async function addAdminCourse(input: AdminCourseInput): Promise<AdminCourse[]> {
  const supabase = createClient();
  const { error } = await supabase.from("courses").insert(inputToRow(input));
  if (error) throw new Error(error.message);
  return getAdminCourses();
}

export async function updateAdminCourse(
  id: number,
  input: Partial<AdminCourseInput>
): Promise<AdminCourse[]> {
  const supabase = createClient();
  const { error } = await supabase.from("courses").update(inputToRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  return getAdminCourses();
}

export async function deleteAdminCourse(id: number): Promise<AdminCourse[]> {
  const supabase = createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return getAdminCourses();
}

export async function assignMentor(id: number, mentorId: number): Promise<AdminCourse[]> {
  return updateAdminCourse(id, { mentorIds: [mentorId] });
}

export async function unassignMentor(id: number): Promise<AdminCourse[]> {
  return updateAdminCourse(id, { mentorIds: [] });
}