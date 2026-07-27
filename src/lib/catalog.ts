// The effective course catalog — now read from the Supabase `courses` table.
import { createClient } from "@/lib/supabase/client";
import { Course, Tier, TIERS } from "@/data/courses";

export interface EffectiveCourse extends Course {
  description?: string;
  mentorIds: number[];
  yearCode?: string; // e.g. "3AS" — what distinguishes same-subject courses
}

// Map a DB row (snake_case) to the app's Course shape (camelCase).
function rowToCourse(r: Record<string, unknown>): EffectiveCourse {
  const tier = (TIERS as string[]).includes(r.tier as string)
    ? (r.tier as Tier)
    : "High School";
  const mentorId = (r.mentor_id as number) ?? 1;
  return {
    id: r.id as number,
    subject: r.subject as string,
    tier,
    track: (r.track as string) ?? "",
    year: (r.year as number) ?? 1,
    major: (r.major as string) ?? "",
    level: (r.level as string) ?? "",
    status: (r.status as Course["status"]) ?? "available",
    date: (r.session_date as string) ?? "",
    time: (r.session_time as string) ?? "",
    price: (r.price as number) ?? 0,
    priceGroup: (r.price_group as number) ?? 0,
    priceIndividual: (r.price_individual as number) ?? 0,
    mentorId,
    description: (r.description as string) ?? undefined,
    mentorIds: [mentorId],
    yearCode: (r.year_code as string) ?? "",
  };
}

export async function effectiveCourses(): Promise<EffectiveCourse[]> {
  const supabase = createClient();
  const { data } = await supabase.from("courses").select("*").order("id");
  return (data ?? []).map(rowToCourse);
}

export async function effectiveCourse(
  id: number
): Promise<EffectiveCourse | undefined> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? rowToCourse(data) : undefined;
}