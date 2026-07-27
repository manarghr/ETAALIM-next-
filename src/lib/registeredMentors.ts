// Registered mentors (real signups) shaped as `Mentor` objects so they slot
// into the directory, profile page and filters next to the seed mentors. Their
// numeric `public_id` is the routing/follows/messages handle. Mentors whose
// email matches a seed are skipped here — they're already the seed card (with
// their real edits overlaid), so we don't duplicate them.
import {
  Mentor,
  Certificate,
  TeachTier,
  mentors as seedMentors,
} from "@/data/mentors";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_PHOTO = "/images/mentor-default.jpg";

// The real account uuid for a mentor's numeric public_id (seed mentors who have
// signed up are pinned to their seed id; registered mentors get 100+). Returns
// null when no such account exists — the single source of truth for turning the
// numeric id used across the app (follows, messages) into the real uuid.
export async function mentorUidByPublicId(
  publicId: number
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("mentors")
    .select("id")
    .eq("public_id", publicId)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

function rowToMentor(
  m: Record<string, unknown>,
  profile: { name?: string; email?: string; phone?: string }
): Mentor {
  const tier = m.teaching_tier as TeachTier | null;
  const years = (m.teaching_years as string[] | null) ?? [];
  return {
    id: m.public_id as number,
    name: profile.name ?? "Mentor",
    major: (m.major as string) ?? "",
    level: (m.level as string) ?? "",
    experience: (m.experience as number) ?? 0,
    skills: (m.skills as string) ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    profilePicture: (m.profile_picture as string) || DEFAULT_PHOTO,
    title: (m.title as string) ?? "",
    bio: (m.bio as string) ?? "",
    shortBio: "",
    linkedin: "",
    certificates: (m.certificates as Certificate[]) ?? [],
    achievements: (m.achievements as string[]) ?? [],
    previewPoster: "",
    previewVideo: "",
    lessons: [],
    teaching: tier ? [{ tier, years }] : [],
  };
}

// All registered mentors (excluding those that are already seed mentors).
export async function getRegisteredMentors(): Promise<Mentor[]> {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from("mentors")
    .select(
      "id, public_id, major, level, experience, skills, title, bio, certificates, achievements, teaching_tier, teaching_years, profile_picture"
    )
    .not("public_id", "is", null);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, phone")
    .in("id", ids);
  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      { name: p.name as string, email: p.email as string, phone: p.phone as string },
    ])
  );

  const seedEmails = new Set(seedMentors.map((s) => s.email.toLowerCase()));

  const result: Mentor[] = [];
  for (const r of rows) {
    const profile: { name?: string; email?: string; phone?: string } =
      byId.get(r.id as string) ?? {};
    // Skip seed mentors (they're already in the directory as their seed card).
    if (profile.email && seedEmails.has(profile.email.toLowerCase())) continue;
    if (r.public_id == null) continue;
    result.push(rowToMentor(r, profile));
  }
  return result;
}

// One registered mentor by their numeric public_id (for the profile page), or
// null when it's not a registered mentor.
export async function getRegisteredMentor(publicId: number): Promise<Mentor | null> {
  const supabase = createClient();
  const { data: m } = await supabase
    .from("mentors")
    .select(
      "id, public_id, major, level, experience, skills, title, bio, certificates, achievements, teaching_tier, teaching_years, profile_picture"
    )
    .eq("public_id", publicId)
    .maybeSingle();
  if (!m) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone")
    .eq("id", m.id as string)
    .maybeSingle();

  return rowToMentor(m, {
    name: profile?.name as string,
    email: profile?.email as string,
    phone: profile?.phone as string,
  });
}
