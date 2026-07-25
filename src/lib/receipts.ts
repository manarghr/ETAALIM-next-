// The current student's purchase history, read from the Supabase `enrollments`
// table. RLS returns only the logged-in user's own rows.
import { createClient } from "@/lib/supabase/client";

export interface Receipt {
  id: number;
  courseId: number;
  mode: string;
  price: number;
  ref: string;
  date: string;
}

export async function getReceipts(): Promise<Receipt[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, course_id, mode, price, ref, created_at")
    .order("created_at", { ascending: false }); // newest first

  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    mode: r.mode,
    price: r.price,
    ref: r.ref,
    date: r.created_at,
  }));
}
