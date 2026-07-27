// Followed mentors, backed by the Supabase `follows` table (RLS per user).
import { createClient } from "@/lib/supabase/client";
import { getMentorById } from "@/data/mentors";

// Ids of every mentor the current user follows.
export async function getFollowedMentorIds(): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase.from("follows").select("mentor_id");
  return (data ?? []).map((r) => r.mentor_id as number);
}

// Is the current user following this mentor?
export async function isFollowing(mentorId: number): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("follows")
    .select("mentor_id")
    .eq("mentor_id", mentorId)
    .maybeSingle();
  return !!data;
}

// Follow / unfollow. `following` = current state. Returns the NEW state.
export async function toggleFollow(
  mentorId: number,
  following: boolean
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return following; // not logged in → no change

  if (following) {
    await supabase.from("follows").delete().eq("mentor_id", mentorId);
    return false;
  }

  // Resolve the mentor's real account uuid (by the seed profile's email) so the
  // mentor can see this follow in their notifications.
  const mentor = getMentorById(mentorId);
  let mentorUid: string | null = null;
  if (mentor) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", mentor.email)
      .eq("role", "mentor")
      .maybeSingle();
    mentorUid = (data?.id as string) ?? null;
  }

  await supabase
    .from("follows")
    .insert({ user_id: user.id, mentor_id: mentorId, mentor_uid: mentorUid });
  return true;
}
