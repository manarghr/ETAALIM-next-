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
