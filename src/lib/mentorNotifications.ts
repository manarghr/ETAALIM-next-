// The mentor's activity feed — everything that happens around them, derived
// live from real Supabase tables (no separate notifications table, no
// localStorage). Three sources, merged and sorted newest-first:
//   • a student sends a message          → "X sent you a message"
//   • a student enrolls in their course  → "X joined <course>"
//   • a student follows them             → "X started following you"
// "Unread" is tracked server-side via profiles.notif_seen_at.
import { createClient } from "@/lib/supabase/client";

export interface MentorNotification {
  id: string;
  type: "message" | "enroll" | "follow";
  actorName: string;
  detail?: string; // course subject (enroll)
  mode?: string; // session mode (enroll)
  date: string; // ISO
}

function nameMap(
  profiles: { id: string; name: string }[] | null
): Map<string, string> {
  return new Map((profiles ?? []).map((p) => [p.id, p.name]));
}

export async function getMentorNotifications(): Promise<MentorNotification[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: msgs }, { data: enrolls }, { data: follows }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("id, student_id, created_at")
        .eq("mentor_id", user.id)
        .eq("sender", "student")
        .order("id", { ascending: false })
        .limit(40),
      supabase
        .from("enrollments")
        .select("id, user_id, course_id, mode, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("follows")
        .select("user_id, created_at")
        .eq("mentor_uid", user.id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  // Batch-resolve actor names and course subjects.
  const actorIds = new Set<string>();
  (msgs ?? []).forEach((m) => actorIds.add(m.student_id as string));
  (enrolls ?? []).forEach((e) => actorIds.add(e.user_id as string));
  (follows ?? []).forEach((f) => actorIds.add(f.user_id as string));

  const courseIds = [
    ...new Set((enrolls ?? []).map((e) => e.course_id as number)),
  ];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from("profiles").select("id, name").in("id", [...actorIds]),
    courseIds.length
      ? supabase.from("courses").select("id, subject").in("id", courseIds)
      : Promise.resolve({ data: [] as { id: number; subject: string }[] }),
  ]);
  const names = nameMap(profiles as { id: string; name: string }[] | null);
  const subjectById = new Map(
    ((courses as { id: number; subject: string }[]) ?? []).map((c) => [
      c.id,
      c.subject,
    ])
  );

  const feed: MentorNotification[] = [];

  // One message notification per student (their latest), to avoid spam.
  const seenStudents = new Set<string>();
  for (const m of msgs ?? []) {
    const sid = m.student_id as string;
    if (seenStudents.has(sid)) continue;
    seenStudents.add(sid);
    feed.push({
      id: `msg-${m.id}`,
      type: "message",
      actorName: names.get(sid) ?? "A student",
      date: m.created_at as string,
    });
  }

  for (const e of enrolls ?? []) {
    feed.push({
      id: `enr-${e.id}`,
      type: "enroll",
      actorName: names.get(e.user_id as string) ?? "A student",
      detail: subjectById.get(e.course_id as number) ?? "",
      mode: (e.mode as string) ?? "recorded",
      date: e.created_at as string,
    });
  }

  for (const f of follows ?? []) {
    feed.push({
      id: `fol-${f.user_id}-${f.created_at}`,
      type: "follow",
      actorName: names.get(f.user_id as string) ?? "A student",
      date: f.created_at as string,
    });
  }

  feed.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return feed;
}

// When the mentor last opened their notifications (server-side, per profile).
export async function getNotifSeenAt(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data } = await supabase
    .from("profiles")
    .select("notif_seen_at")
    .eq("id", user.id)
    .maybeSingle();
  return (data?.notif_seen_at as string) ?? "";
}

// Mark notifications seen up to `upTo` — the newest notification's own server
// timestamp, so the comparison stays clock-skew-proof.
export async function markNotifsSeen(upTo: string): Promise<void> {
  if (!upTo) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ notif_seen_at: upTo })
    .eq("id", user.id);
}

// Live updates across all three sources.
export function subscribeNotifications(onChange: () => void): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel("mentor-notifications")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => onChange())
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "enrollments" }, () => onChange())
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "follows" }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
