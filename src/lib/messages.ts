// Student↔mentor messaging, backed by the Supabase `messages` table. A message
// links two real accounts by uuid: the logged-in student (student_id) and the
// mentor's real account (mentor_id). Students browse *seed* mentor profiles
// (numeric ids), so we resolve a seed mentor to their real account by email —
// only mentors who have actually signed up can receive DMs. RLS scopes every
// row to the two people in the thread.
import { createClient } from "@/lib/supabase/client";
import { getMentorById, mentors } from "@/data/mentors";
import { mentorUidByPublicId } from "@/lib/registeredMentors";

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

const DEFAULT_PHOTO = "/images/mentor-default.jpg";

/** Human-readable file size. */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read a picked file into an Attachment (base64). Null if it's over the limit. */
export function readFileAsAttachment(file: File): Promise<Attachment | null> {
  return new Promise((resolve) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        kind: file.type.startsWith("image/") ? "image" : "file",
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
      });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Resolve a mentor's numeric id (public_id — seed or registered) to their real
// account uuid. Tries public_id first, then falls back to matching the seed
// mentor's email (so it works before the public_id migration too). Null = the
// mentor hasn't signed up (no inbox to deliver to).
async function mentorUuid(mentorId: number): Promise<string | null> {
  const byPublic = await mentorUidByPublicId(mentorId);
  if (byPublic) return byPublic;

  const mentor = getMentorById(mentorId);
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

  // Resolve each mentor uuid to a browsable identity. Every messageable mentor
  // has a `mentors` row (public_id + avatar); names come from `profiles`. Seed
  // mentors keep their richer seed name/avatar.
  const uuids = [...byMentor.keys()];
  const [{ data: mentorRows }, { data: profiles }] = await Promise.all([
    supabase.from("mentors").select("id, public_id, profile_picture").in("id", uuids),
    supabase.from("profiles").select("id, name, email").in("id", uuids),
  ]);
  const mentorById = new Map((mentorRows ?? []).map((m) => [m.id, m]));
  const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const threads: StudentThread[] = [];
  for (const [uuid, msgs] of byMentor) {
    const mrow = mentorById.get(uuid);
    const prof = profById.get(uuid);
    const email = ((prof?.email as string) ?? "").toLowerCase();
    const seed = mentors.find((mt) => mt.email.toLowerCase() === email);

    const publicId = (mrow?.public_id as number) ?? seed?.id;
    if (publicId == null) continue; // can't map to a profile route

    const name = seed?.name ?? (prof?.name as string) ?? "Mentor";
    const avatar =
      seed?.profilePicture ?? (mrow?.profile_picture as string) ?? DEFAULT_PHOTO;
    threads.push({
      mentorSeedId: publicId,
      mentorName: name,
      avatar,
      initials: initialsOf(name),
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
