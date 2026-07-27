// Generic "last seen" markers stored on the user's profile row, one timestamptz
// column per section (e.g. courses_seen_at, saved_seen_at). Powers the
// "new since you last opened this" badges that clear on open. Server-side, so it
// persists across reloads and devices.
import { createClient } from "@/lib/supabase/client";

export async function getSeenAt(field: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data } = await supabase
    .from("profiles")
    .select(field)
    .eq("id", user.id)
    .maybeSingle();
  return (data as Record<string, string> | null)?.[field] ?? "";
}

// Mark a section seen up to `upTo` — the newest item's server timestamp.
export async function markSeen(field: string, upTo: string): Promise<void> {
  if (!upTo) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ [field]: upTo }).eq("id", user.id);
}
