// The student's activity feed — real Supabase events, merged newest-first:
//   • a mentor replies                → "{mentor} replied to you"
//   • they buy/enroll (a purchase tx) → "You enrolled in {course}"
//   • they top up their wallet        → "Top-up of {amount} DZD succeeded"
// "Unread" is tracked server-side via profiles.student_notif_seen_at.
import { createClient } from "@/lib/supabase/client";

export interface StudentNotification {
  id: string;
  type: "reply" | "enroll" | "topup";
  actorName?: string; // mentor name (reply)
  detail?: string; // course subject (enroll)
  amount?: number; // DZD (topup)
  date: string; // ISO
}

export async function getStudentNotifications(): Promise<StudentNotification[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: msgs }, { data: txs }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, mentor_id, created_at")
      .eq("student_id", user.id)
      .eq("sender", "mentor")
      .order("id", { ascending: false })
      .limit(40),
    supabase
      .from("transactions")
      .select("id, type, amount, subject, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  // Resolve mentor names for the reply notifications.
  const mentorIds = [...new Set((msgs ?? []).map((m) => m.mentor_id as string))];
  const { data: profiles } = mentorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", mentorIds)
    : { data: [] as { id: string; name: string }[] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name as string]));

  const feed: StudentNotification[] = [];

  // One reply notification per mentor (their latest), to avoid spam.
  const seenMentors = new Set<string>();
  for (const m of msgs ?? []) {
    const mid = m.mentor_id as string;
    if (seenMentors.has(mid)) continue;
    seenMentors.add(mid);
    feed.push({
      id: `rep-${m.id}`,
      type: "reply",
      actorName: names.get(mid) ?? "Your mentor",
      date: m.created_at as string,
    });
  }

  for (const t of txs ?? []) {
    if ((t.type as string) === "topup") {
      feed.push({
        id: `top-${t.id}`,
        type: "topup",
        amount: t.amount as number,
        date: t.created_at as string,
      });
    } else {
      feed.push({
        id: `enr-${t.id}`,
        type: "enroll",
        detail: (t.subject as string) ?? "",
        date: t.created_at as string,
      });
    }
  }

  feed.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return feed;
}

export async function getStudentNotifSeenAt(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data } = await supabase
    .from("profiles")
    .select("student_notif_seen_at")
    .eq("id", user.id)
    .maybeSingle();
  return (data?.student_notif_seen_at as string) ?? "";
}

export async function markStudentNotifsSeen(upTo: string): Promise<void> {
  if (!upTo) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ student_notif_seen_at: upTo })
    .eq("id", user.id);
}

// Live updates: mentor replies (messages) + wallet activity (transactions).
export function subscribeStudentNotifications(onChange: () => void): () => void {
  const supabase = createClient();
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || cancelled) return;
    channel = supabase
      .channel(`student-notifs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `student_id=eq.${user.id}`,
        },
        () => onChange()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => onChange()
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
