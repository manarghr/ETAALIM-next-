// The logged-in mentor's own profile, backed by Supabase (`profiles` for the
// identity fields, `mentors` for the professional ones). Replaces the
// localStorage mentor store for the editable profile — edits now persist
// server-side and become the source the public page can read later. RLS scopes
// every read/write to the mentor's own row (auth.uid() = id).
import { createClient } from "@/lib/supabase/client";
import { Certificate, getMentorById } from "@/data/mentors";

export interface MentorProfileData {
  name: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
  major: string;
  level: string;
  experience: number;
  skills: string[];
  certificates: Certificate[];
  achievements: string[];
  hourlyRate: number;
  availability: string;
  profilePicture: string;
}

// Load the current mentor's profile, or null if not signed in / no row yet.
export async function getMyMentorProfile(): Promise<MentorProfileData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: mentor }] = await Promise.all([
    supabase.from("profiles").select("name, email, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("mentors")
      .select(
        "major, level, experience, skills, title, bio, certificates, achievements, hourly_rate, availability, profile_picture"
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!mentor && !profile) return null;

  return {
    name: (profile?.name as string) ?? "",
    email: (profile?.email as string) ?? "",
    phone: (profile?.phone as string) ?? "",
    title: (mentor?.title as string) ?? "",
    bio: (mentor?.bio as string) ?? "",
    major: (mentor?.major as string) ?? "",
    level: (mentor?.level as string) ?? "",
    experience: (mentor?.experience as number) ?? 0,
    skills: mentor?.skills
      ? String(mentor.skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    certificates: (mentor?.certificates as Certificate[]) ?? [],
    achievements: (mentor?.achievements as string[]) ?? [],
    hourlyRate: (mentor?.hourly_rate as number) ?? 0,
    availability: (mentor?.availability as string) ?? "",
    profilePicture: (mentor?.profile_picture as string) ?? "/images/mentor-default.jpg",
  };
}

/** The fields a mentor can edit, shaped to overlay a seed `Mentor` object on the
 *  public profile page. `skills` stays a comma string to match `Mentor.skills`. */
export interface MentorOverrides {
  name?: string;
  phone?: string;
  title?: string;
  bio?: string;
  major?: string;
  level?: string;
  experience?: number;
  skills?: string;
  certificates?: Certificate[];
  achievements?: string[];
}

// The real, saved overrides for a seed mentor (resolved by their email), or null
// when that mentor hasn't signed up / saved anything. Used to overlay the public
// profile page so a mentor's edits are visible to everyone.
export async function getPublicMentorProfile(
  seedMentorId: number
): Promise<MentorOverrides | null> {
  const seed = getMentorById(seedMentorId);
  if (!seed) return null;

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("email", seed.email)
    .eq("role", "mentor")
    .maybeSingle();
  if (!profile) return null;

  const { data: m } = await supabase
    .from("mentors")
    .select("major, level, experience, skills, title, bio, certificates, achievements")
    .eq("id", profile.id)
    .maybeSingle();
  if (!m) return null;

  const ov: MentorOverrides = {};
  if (profile.name) ov.name = profile.name as string;
  if (profile.phone) ov.phone = profile.phone as string;
  if (m.title) ov.title = m.title as string;
  if (m.bio) ov.bio = m.bio as string;
  if (m.major) ov.major = m.major as string;
  if (m.level) ov.level = m.level as string;
  if (m.experience) ov.experience = m.experience as number;
  if (m.skills) ov.skills = m.skills as string;
  if (Array.isArray(m.certificates) && m.certificates.length)
    ov.certificates = m.certificates as Certificate[];
  if (Array.isArray(m.achievements) && m.achievements.length)
    ov.achievements = m.achievements as string[];
  return ov;
}

// Persist the mentor's edits. Identity fields go to `profiles`, professional
// ones to `mentors`. Only the provided fields are written.
export async function saveMyMentorProfile(
  p: Partial<MentorProfileData>
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const profileRow: Record<string, unknown> = {};
  if (p.phone !== undefined) profileRow.phone = p.phone;
  if (p.name !== undefined) profileRow.name = p.name;

  const mentorRow: Record<string, unknown> = {};
  if (p.title !== undefined) mentorRow.title = p.title;
  if (p.bio !== undefined) mentorRow.bio = p.bio;
  if (p.major !== undefined) mentorRow.major = p.major;
  if (p.level !== undefined) mentorRow.level = p.level;
  if (p.experience !== undefined) mentorRow.experience = p.experience;
  if (p.skills !== undefined) mentorRow.skills = p.skills.join(", ");
  if (p.certificates !== undefined) mentorRow.certificates = p.certificates;
  if (p.achievements !== undefined) mentorRow.achievements = p.achievements;
  if (p.hourlyRate !== undefined) mentorRow.hourly_rate = p.hourlyRate;
  if (p.availability !== undefined) mentorRow.availability = p.availability;

  const tasks: PromiseLike<unknown>[] = [];
  if (Object.keys(profileRow).length > 0) {
    tasks.push(supabase.from("profiles").update(profileRow).eq("id", user.id));
  }
  if (Object.keys(mentorRow).length > 0) {
    tasks.push(supabase.from("mentors").update(mentorRow).eq("id", user.id));
  }
  const results = await Promise.all(tasks);
  for (const r of results) {
    const err = (r as { error?: { message: string } }).error;
    if (err) console.error("saveMyMentorProfile:", err.message);
  }
}
