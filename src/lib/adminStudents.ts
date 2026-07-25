import { createClient } from "@/lib/supabase/client";
import { StudentRecord, StudentTx } from "@/data/students";
import { Cycle } from "@/data/education";

function initialsOf(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// Every registered student (role = 'student'), with their real enrollments
// and transactions. Only works when the caller is an admin (RLS).
export async function getAllStudents(): Promise<StudentRecord[]> {
  const supabase = createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, phone, age, parent_email, parent_phone, cycle, year, stream, balance, created_at")
    .eq("role", "student");

  const { data: enr } = await supabase.from("enrollments").select("user_id, course_id");
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, user_id, type, amount, subject, created_at")
    .order("created_at", { ascending: false });

  // group enrollments + transactions by user id
  const coursesByUser: Record<string, number[]> = {};
  (enr ?? []).forEach((e) => {
    (coursesByUser[e.user_id as string] ??= []).push(e.course_id as number);
  });
  const txByUser: Record<string, StudentTx[]> = {};
  (txs ?? []).forEach((t) => {
    (txByUser[t.user_id as string] ??= []).push({
      id: String(t.id),
      type: t.type === "topup" ? "topup" : "purchase",
      subject: (t.subject as string) ?? undefined,
      amount: t.amount as number,
      date: t.created_at as string,
    });
  });

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: (p.name as string) ?? "Student",
    initials: initialsOf((p.name as string) ?? "S"),
    cycle: ((p.cycle as string) ?? "high") as Cycle,
    year: (p.year as string) ?? "",
    extra: (p.stream as string) ?? "",
    email: (p.email as string) ?? "",
    phone: (p.phone as string) ?? "",
    joined: (p.created_at as string) ?? new Date().toISOString(),
    enrolledCourseIds: coursesByUser[p.id as string] ?? [],
    transactions: txByUser[p.id as string] ?? [],
    balance: (p.balance as number) ?? 0,
    age: (p.age as number) ?? undefined,
    parentEmail: (p.parent_email as string) ?? undefined,
    parentPhone: (p.parent_phone as string) ?? undefined,
    registered: true,
  }));
}

// One student by id (for the admin profile page).
export async function getStudentById(id: string): Promise<StudentRecord | null> {
  const all = await getAllStudents();
  return all.find((s) => s.id === id) ?? null;
}