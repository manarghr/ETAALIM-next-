// Student↔mentor messaging, backed by the Supabase `messages` table. The mentor
// sends a canned auto-reply so a thread feels alive (mentors are seed data, not
// real users). RLS scopes every message to the logged-in student.
import { createClient } from "@/lib/supabase/client";

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
  /** true for the canned mentor reply — rendered via i18n, not stored text */
  auto?: boolean;
  date: string; // ISO
}

/** Largest attachment we'll keep. */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB

// The conversation with one mentor, oldest first.
export async function getThread(mentorId: number): Promise<Message[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, sender, text, attachment, auto, created_at")
    .eq("mentor_id", mentorId)
    .order("id", { ascending: true });

  return (data ?? []).map((m) => ({
    id: String(m.id),
    from: m.sender === "mentor" ? "mentor" : "student",
    text: (m.text as string) ?? "",
    attachment: (m.attachment as Attachment) ?? undefined,
    auto: !!m.auto,
    date: m.created_at as string,
  }));
}

// Send a student message (+ the mentor's canned auto-reply). Returns the thread.
export async function sendMessage(
  mentorId: number,
  text: string,
  attachment?: Attachment
): Promise<Message[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return getThread(mentorId);

  await supabase.from("messages").insert([
    {
      user_id: user.id,
      mentor_id: mentorId,
      sender: "student",
      text,
      attachment: attachment ?? null,
    },
    {
      user_id: user.id,
      mentor_id: mentorId,
      sender: "mentor",
      text: "",
      auto: true,
    },
  ]);

  return getThread(mentorId);
}
