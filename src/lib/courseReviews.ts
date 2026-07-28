// Course reviews backed by the Supabase `reviews` table.
// Public read (anyone sees them), authenticated write (own review only).
import { createClient } from "@/lib/supabase/client";

export interface CourseReview {
  id: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

// All reviews for a course, newest first.
export async function getCourseReviews(courseId: number): Promise<CourseReview[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, author_name, rating, text, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    author: r.author_name,
    rating: r.rating,
    text: r.text ?? "",
    date: r.created_at,
  }));
}

// Every review on the platform, grouped by course id, newest first — one query
// for the admin overview (which needs counts and averages across all courses at
// once, so asking course by course would be dozens of round-trips).
export async function getAllReviews(): Promise<Record<number, CourseReview[]>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, course_id, author_name, rating, text, created_at")
    .order("created_at", { ascending: false });

  const byCourse: Record<number, CourseReview[]> = {};
  for (const r of data ?? []) {
    const list = (byCourse[r.course_id as number] ??= []);
    list.push({
      id: r.id,
      author: r.author_name,
      rating: r.rating,
      text: r.text ?? "",
      date: r.created_at,
    });
  }
  return byCourse;
}

/** A mentor's real aggregate rating, across reviews of all their courses. */
export interface MentorRating {
  avg: number; // 0 when no reviews
  count: number;
}

// Compute one mentor's rating from reviews of the courses attributed to them.
export async function getMentorRating(mentorId: number): Promise<MentorRating> {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("mentor_id", mentorId);
  const ids = (courses ?? []).map((c) => c.id as number);
  if (ids.length === 0) return { avg: 0, count: 0 };

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .in("course_id", ids);
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };

  const sum = reviews.reduce((s, r) => s + (r.rating as number), 0);
  return { avg: sum / reviews.length, count: reviews.length };
}

// Ratings for every mentor at once (for the directory cards), keyed by the
// numeric mentor id.
export async function getMentorRatings(): Promise<Record<number, MentorRating>> {
  const supabase = createClient();
  const { data: reviews } = await supabase.from("reviews").select("course_id, rating");
  if (!reviews || reviews.length === 0) return {};

  const courseIds = [...new Set(reviews.map((r) => r.course_id as number))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, mentor_id")
    .in("id", courseIds);
  const mentorByCourse = new Map(
    (courses ?? []).map((c) => [c.id as number, c.mentor_id as number])
  );

  const agg: Record<number, { sum: number; count: number }> = {};
  for (const r of reviews) {
    const mid = mentorByCourse.get(r.course_id as number);
    if (mid == null) continue;
    agg[mid] = agg[mid] ?? { sum: 0, count: 0 };
    agg[mid].sum += r.rating as number;
    agg[mid].count += 1;
  }

  const result: Record<number, MentorRating> = {};
  for (const k of Object.keys(agg)) {
    const a = agg[Number(k)];
    result[Number(k)] = { avg: a.sum / a.count, count: a.count };
  }
  return result;
}

// Post a review as the logged-in user (their profile name is stored with it).
export async function postReview(
  courseId: number,
  rating: number,
  text: string
): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    course_id: courseId,
    author_name: profile?.name ?? "Student",
    rating,
    text: text || null,
  });
  if (error) throw new Error(error.message);
}
