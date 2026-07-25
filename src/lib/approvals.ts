import { createClient } from "@/lib/supabase/client";

export interface Approval {
  id: number;
  courseId: number;
  courseName: string;
  amount: number;
  mode: string;
  parentEmail: string | null;
  status: "pending" | "approved" | "denied";
}

export async function getApprovals(): Promise<Approval[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("approvals")
    .select("id, course_id, course_name, amount, mode, parent_email, status")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id as number,
    courseId: r.course_id as number,
    courseName: r.course_name as string,
    amount: r.amount as number,
    mode: r.mode as string,
    parentEmail: (r.parent_email as string) ?? null,
    status: r.status as Approval["status"],
  }));
}

export async function createApproval(p: {
  courseId: number;
  courseName: string;
  amount: number;
  mode: string;
  parentEmail: string;
}): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  await supabase.from("approvals").insert({
    user_id: user.id,
    course_id: p.courseId,
    course_name: p.courseName,
    amount: p.amount,
    mode: p.mode,
    parent_email: p.parentEmail || null,
  });

  }

export async function setApprovalStatus(
  id: number,
  status: "approved" | "denied"
): Promise<void> {
  const supabase = createClient();
  await supabase.from("approvals").update({ status }).eq("id", id);
}