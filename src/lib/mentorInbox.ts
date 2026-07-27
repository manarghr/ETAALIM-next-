// Mentor inbox: the conversations students have started with the logged-in
// mentor, backed by the Supabase `messages` table (keyed by the mentor's real
// account uuid). Threads are grouped by student and each student's display name
// is joined from `profiles`. RLS lets a mentor read/insert only their own rows.
import { createClient } from "@/lib/supabase/client";
import { Attachment } from "@/lib/messages";

export interface InboxMessage {
  id: string;
  from: "student" | "mentor";
  text: string;
  attachment?: Attachment;
  date: string; // ISO
}

export interface InboxThread {
  studentId: string;
  studentName: string;
  initials: string;
  messages: InboxMessage[];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// All threads for the current mentor, most-recently-active first.
export async function getInbox(): Promise<InboxThread[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("messages")
    .select("id, student_id, sender, text, attachment, created_at")
    .eq("mentor_id", user.id)
    .order("id", { ascending: true });

  if (!rows || rows.length === 0) return [];

  // Group messages by student.
  const byStudent = new Map<string, InboxMessage[]>();
  for (const r of rows) {
    const list = byStudent.get(r.student_id) ?? [];
    list.push({
      id: String(r.id),
      from: r.sender === "mentor" ? "mentor" : "student",
      text: r.text ?? "",
      attachment: (r.attachment as Attachment) ?? undefined,
      date: r.created_at as string,
    });
    byStudent.set(r.student_id, list);
  }

  // Join student display names.
  const ids = [...byStudent.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", ids);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name as string]));

  const threads: InboxThread[] = ids.map((id) => {
    const name = nameById.get(id) ?? "Student";
    return {
      studentId: id,
      studentName: name,
      initials: initialsOf(name),
      messages: byStudent.get(id) ?? [],
    };
  });

  // Most recent activity first.
  threads.sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.date ?? "";
    const lb = b.messages[b.messages.length - 1]?.date ?? "";
    return lb.localeCompare(la);
  });
  return threads;
}

// Mentor replies to a student (optionally with an attachment). Returns the
// refreshed inbox.
export async function replyToThread(
  studentId: string,
  text: string,
  attachment?: Attachment
): Promise<InboxThread[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return getInbox();

  const { error } = await supabase.from("messages").insert({
    student_id: studentId,
    mentor_id: user.id,
    sender: "mentor",
    text,
    attachment: attachment ?? null,
  });
  if (error) console.error("replyToThread error:", error.message);

  return getInbox();
}

// Live updates: fire `onInsert` whenever a message lands in the mentor's inbox,
// passing the new row's sender so the caller can notify only on student DMs.
export function subscribeInbox(
  onInsert: (sender: "student" | "mentor") => void
): () => void {
  const supabase = createClient();
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || cancelled) return;

    channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `mentor_id=eq.${user.id}`,
        },
        (payload) => {
          const sender = (payload.new as { sender: string }).sender;
          onInsert(sender === "mentor" ? "mentor" : "student");
        }
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
