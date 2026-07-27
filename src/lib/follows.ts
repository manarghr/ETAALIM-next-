// Followed mentors, backed by the Supabase `follows` table (RLS per user).
import { createClient } from "@/lib/supabase/client";
import { getMentorById } from "@/data/mentors";
import { mentorUidByPublicId } from "@/lib/registeredMentors";

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

  // Resolve the mentor's real account uuid so they can see this follow in their
  // notifications — by public_id first, then the seed email as a fallback.
  let mentorUid: string | null = await mentorUidByPublicId(mentorId);
  if (!mentorUid) {
    const mentor = getMentorById(mentorId);
    if (mentor) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", mentor.email)
        .eq("role", "mentor")
        .maybeSingle();
      mentorUid = (data?.id as string) ?? null;
    }
  }

  await supabase
    .from("follows")
    .insert({ user_id: user.id, mentor_id: mentorId, mentor_uid: mentorUid });
  return true;
}
