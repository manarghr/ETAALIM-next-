// Finishing sign-up for people who arrived through Google.
//
// A Google sign-in gives us an auth user and (via the `handle_new_user`
// trigger) a `profiles` row — but Google only tells us a name, an email and an
// avatar. It never tells us whether this person is a student or a teacher, what
// year they're in, or their phone number. So a Google account starts life
// INCOMPLETE, and `/welcome` collects the rest before they reach a dashboard.
//
// Nothing here creates an account: the row already exists, we only fill it in.
import { createClient } from "@/lib/supabase/client";

export interface OnboardingState {
  email: string;
  /** Name from Google (or whatever the profile already has) — prefills the form. */
  name: string;
  phone: string;
  role: string;
  /** Google's picture, reused as the mentor's profile photo if they pick mentor. */
  avatar: string | null;
  /** true = nothing left to ask; the caller should just go to the dashboard. */
  complete: boolean;
}

// What we still need from the signed-in user, or null if nobody is signed in.
export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone, role, cycle, year")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const role = (profile?.role as string) ?? "student";

  return {
    email: (profile?.email as string) ?? user.email ?? "",
    name: (profile?.name as string) || (meta.full_name as string) || (meta.name as string) || "",
    phone: (profile?.phone as string) ?? "",
    role,
    avatar: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
    // Mentors are complete as soon as they have a mentors row (the mentor form
    // fills it); students need their education cycle + year.
    complete: role === "mentor" ? true : Boolean(profile?.cycle && profile?.year),
  };
}

export interface StudentOnboarding {
  name: string;
  phone: string;
  age: number;
  parentEmail: string | null;
  parentPhone: string | null;
  cycle: string;
  year: string;
  stream: string | null;
}

/** Fill in the student half of the profile. Returns an error message, or null. */
export async function completeStudentOnboarding(
  p: StudentOnboarding
): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Not signed in";

  const { error } = await supabase
    .from("profiles")
    .update({
      name: p.name,
      phone: p.phone,
      role: "student",
      age: p.age,
      parent_email: p.parentEmail,
      parent_phone: p.parentPhone,
      cycle: p.cycle,
      year: p.year,
      stream: p.stream,
    })
    .eq("id", user.id);
  return error?.message ?? null;
}

export interface MentorOnboarding {
  name: string;
  phone: string;
  major: string;
  level: string;
  experience: number;
  teachingTier: string;
  teachingYears: string[];
  profilePicture: string | null;
}

/** Turn a fresh Google account into a mentor: flip the role and create the
 *  `mentors` row the mentor dashboard reads. Returns an error message, or null. */
export async function completeMentorOnboarding(
  p: MentorOnboarding
): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Not signed in";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name: p.name, phone: p.phone, role: "mentor" })
    .eq("id", user.id);
  if (profileError) return profileError.message;

  // upsert, not insert: the row already exists if they signed up through the
  // mentor form and are only finishing the professional details.
  const { error: mentorError } = await supabase.from("mentors").upsert({
    id: user.id,
    major: p.major,
    level: p.level,
    experience: p.experience,
    title: p.level ? `${p.level} · ${p.major}` : p.major,
    teaching_tier: p.teachingTier,
    teaching_years: p.teachingYears.length ? p.teachingYears : null,
    profile_picture: p.profilePicture || "/images/mentor-default.jpg",
  });
  return mentorError?.message ?? null;
}
