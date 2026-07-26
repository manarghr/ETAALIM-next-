// Student↔mentor messaging, backed by the Supabase `messages` table. A message
// links two real accounts by uuid: the logged-in student (student_id) and the
// mentor's real account (mentor_id). Students browse *seed* mentor profiles
// (numeric ids), so we resolve a seed mentor to their real account by email —
// only mentors who have actually signed up can receive DMs. RLS scopes every
// row to the two people in the thread.
import { createClient } from "@/lib/supabase/client";
import { getMentorById, mentors } from "@/data/mentors";

/** An image or file a message carries. Stored as a base64 data URL (kept small).
 *  A future improvement is Supabase Storage instead of inline base64. */
export interface Attachment {
  kind: "image" | "file";
  name: string;
  size: number; // bytes
  mime: string;
  dataUrl: string; // base64 data URL
}

export interface Message {
  id: string;
  from: "student" | "mentor";
  text: string; // may be empty when the message is only an attachment
  attachment?: Attachment;
  date: string; // ISO
}

/** Largest attachment we'll keep. */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB

// Resolve a seed mentor (numeric id shown in the UI) to their real account uuid,
// matching on the email in the seed dataset. Returns null when that mentor has
// not signed up yet (so there's no real inbox to deliver to).
async function mentorUuid(seedMentorId: number): Promise<string | null> {
  const mentor = getMentorById(seedMentorId);
  if (!mentor) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", mentor.email)
    .eq("role", "mentor")
    .maybeSingle();
  return data?.id ?? null;
}

function rowToMessage(m: {
  id: number | string;
  sender: string;
  text: string | null;
  attachment: Attachment | null;
  created_at: string;
}): Message {
  return {
    id: String(m.id),
    from: m.sender === "mentor" ? "mentor" : "student",
    text: m.text ?? "",
    attachment: m.attachment ?? undefined,
    date: m.created_at,
  };
}

// The conversation with one mentor, oldest first.
export async function getThread(seedMentorId: number): Promise<Message[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const mid = await mentorUuid(seedMentorId);
  if (!mid) return [];

  const { data } = await supabase
    .from("messages")
    .select("id, sender, text, attachment, created_at")
    .eq("student_id", user.id)
    .eq("mentor_id", mid)
    .order("id", { ascending: true });

  return (data ?? []).map(rowToMessage);
}

// Send a student message. Returns the refreshed thread.
export async function sendMessage(
  seedMentorId: number,
  text: string,
  attachment?: Attachment
): Promise<Message[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("sendMessage: not logged in");
    return getThread(seedMentorId);
  }

  const mid = await mentorUuid(seedMentorId);
  if (!mid) {
    console.error("sendMessage: this mentor has no account to receive messages");
    return getThread(seedMentorId);
  }

  const { error } = await supabase.from("messages").insert({
    student_id: user.id,
    mentor_id: mid,
    sender: "student",
    text,
    attachment: attachment ?? null,
  });
  if (error) console.error("sendMessage error:", error.message);

  return getThread(seedMentorId);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** One conversation in the student's inbox, tied back to the seed mentor so the
 *  UI can show their name/avatar and load/send with the numeric id. */
export interface StudentThread {
  mentorSeedId: number;
  mentorName: string;
  avatar: string;
  initials: string;
  messages: Message[];
}

// Every conversation the logged-in student has, most-recently-active first.
export async function getStudentInbox(): Promise<StudentThread[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("messages")
    .select("id, mentor_id, sender, text, attachment, created_at")
    .eq("student_id", user.id)
    .order("id", { ascending: true });
  if (!rows || rows.length === 0) return [];

  // Group by mentor (uuid).
  const byMentor = new Map<string, Message[]>();
  for (const r of rows) {
    const list = byMentor.get(r.mentor_id) ?? [];
    list.push(rowToMessage(r));
    byMentor.set(r.mentor_id, list);
  }

  // Resolve each mentor uuid back to its seed profile (via the profile email).
  const uuids = [...byMentor.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", uuids);
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email as string]));

  const threads: StudentThread[] = [];
  for (const [uuid, msgs] of byMentor) {
    const email = (emailById.get(uuid) ?? "").toLowerCase();
    const seed = mentors.find((mt) => mt.email.toLowerCase() === email);
    if (!seed) continue; // a mentor we can't map to a browsable profile
    threads.push({
      mentorSeedId: seed.id,
      mentorName: seed.name,
      avatar: seed.profilePicture,
      initials: initialsOf(seed.name),
      messages: msgs,
    });
  }

  threads.sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.date ?? "";
    const lb = b.messages[b.messages.length - 1]?.date ?? "";
    return lb.localeCompare(la);
  });
  return threads;
}

// Live updates across ALL of the student's threads. `onInsert` receives the new
// row's sender so the caller can, e.g., only notify on mentor replies.
export function subscribeStudentInbox(
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
      .channel(`student-inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `student_id=eq.${user.id}`,
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

// Live updates: call `onChange` whenever a row lands in this thread (e.g. the
// mentor replies). Returns an unsubscribe function. Realtime can only filter on
// one column, so we filter by the student and check the mentor in JS.
export function subscribeThread(
  seedMentorId: number,
  onChange: () => void
): () => void {
  const supabase = createClient();
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || cancelled) return;
    const mid = await mentorUuid(seedMentorId);
    if (!mid || cancelled) return;

    channel = supabase
      .channel(`thread-${user.id}-${mid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          if ((payload.new as { mentor_id: string }).mentor_id === mid) onChange();
        }
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
