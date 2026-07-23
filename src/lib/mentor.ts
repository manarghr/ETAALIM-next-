// Logged-in mentor account, localStorage-backed (mock until Supabase). Two
// kinds of mentor:
//   • a seeded mentor from src/data/mentors (rich demo data — courses, roster,
//     earnings) reached by logging in with their email;
//   • a freshly-registered mentor from the "Become a mentor" form — their own
//     profile, starting with an empty dashboard they build up themselves.
// Immutable pro data comes from the mentors dataset; this store holds the
// mutable/registered bits. Swap the internals for API calls later.
import { mentors, Mentor, Certificate, Teaching } from "@/data/mentors";
import { getCoursesByMentor } from "@/data/courses";
import { getRoster } from "@/data/roster";

export interface EarningTx {
  id: string;
  subject: string; // English course subject (translated at render)
  student: string;
  amount: number; // DZD
  date: string; // ISO
}

export interface MentorAccount extends Mentor {
  bioOverride: string;
  hourlyRate: number; // DZD per private session
  availability: string; // free text, e.g. "Sun–Thu · 4–8 PM"
  earnings: EarningTx[];
}

const KEY = "etaalim.mentor";
const DEMO_MENTOR_ID = 1; // Amina Benali (Mathematics)
const CUSTOM_ID = 9001; // synthetic id for a registered professor (no seeded courses)

interface Stored {
  id: number;
  custom: boolean; // true = profile lives here, not in the mentors dataset
  // identity snapshot (base copy for seeded; the professor's own for custom)
  name: string;
  email: string;
  phone: string;
  major: string;
  title: string;
  level: string;
  experience: number;
  skills: string;
  profilePicture: string;
  certificates: Certificate[];
  achievements: string[];
  /** one cycle + highest year (mentors never span cycles) */
  teaching: Teaching[];
  // editable dashboard bits
  bioOverride: string;
  hourlyRate: number;
  availability: string;
  earnings: EarningTx[];
}

const DEFAULT_PHOTO = "/images/mentor-default.jpg";

function baseMentor(id: number): Mentor {
  return mentors.find((m) => m.id === id) ?? mentors[0];
}

// Deterministic seed earnings from the mentor's courses × their roster.
function seedEarnings(id: number): EarningTx[] {
  const courses = getCoursesByMentor(id).slice(0, 5);
  const txs: EarningTx[] = [];
  courses.forEach((c, ci) => {
    getRoster(c.id)
      .slice(0, 3)
      .forEach((s, si) => {
        txs.push({
          id: `seed-${c.id}-${si}`,
          subject: c.subject,
          student: s.name,
          amount: c.price,
          date: new Date(2026, 5 + (si % 2), 2 + ((ci + si) % 26)).toISOString(),
        });
      });
  });
  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

function seedFor(id: number): Stored {
  const m = baseMentor(id);
  return {
    id,
    custom: false,
    name: m.name,
    email: m.email,
    phone: m.phone,
    major: m.major,
    title: m.title,
    level: m.level,
    experience: m.experience,
    skills: m.skills,
    profilePicture: m.profilePicture,
    certificates: m.certificates,
    achievements: m.achievements,
    teaching: m.teaching,
    bioOverride: m.bio,
    hourlyRate: 1500 + (id % 4) * 500,
    availability: "Sun–Thu · 16:00–20:00",
    earnings: seedEarnings(id),
  };
}

function read(): Stored {
  if (typeof window === "undefined") return seedFor(DEMO_MENTOR_ID);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedFor(DEMO_MENTOR_ID);
      localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Stored;
  } catch {
    return seedFor(DEMO_MENTOR_ID);
  }
}

function write(s: Stored): Stored {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
  return s;
}

function resolve(s: Stored): MentorAccount {
  if (s.custom) {
    // A registered professor — build a full account from stored fields, with
    // empty "rich" extras (no seeded certificates/lessons/etc.).
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      major: s.major,
      level: s.level,
      experience: s.experience,
      skills: s.skills,
      profilePicture: s.profilePicture,
      title: s.title,
      bio: s.bioOverride,
      shortBio: "",
      linkedin: "",
      certificates: [],
      achievements: [],
      previewPoster: "",
      previewVideo: "",
      lessons: [],
      teaching: s.teaching ?? [],
      bioOverride: s.bioOverride,
      hourlyRate: s.hourlyRate,
      availability: s.availability,
      earnings: s.earnings,
    };
  }
  const m = baseMentor(s.id);
  return {
    ...m,
    name: s.name,
    email: s.email,
    phone: s.phone,
    major: s.major,
    title: s.title,
    level: s.level,
    experience: s.experience,
    skills: s.skills,
    profilePicture: s.profilePicture,
    certificates: s.certificates,
    achievements: s.achievements,
    bio: s.bioOverride,
    bioOverride: s.bioOverride,
    hourlyRate: s.hourlyRate,
    availability: s.availability,
    earnings: s.earnings,
  };
}

/** Log in as a mentor by email. If a registered professor's account matches the
 *  email, keep it; otherwise resolve to a seeded mentor (defaults to the demo
 *  mentor) so the dashboard has content to show. */
export function setActiveMentor(email: string): MentorAccount {
  const existing = typeof window !== "undefined" ? read() : null;
  if (existing?.custom && existing.email.toLowerCase() === email.trim().toLowerCase()) {
    return resolve(existing);
  }
  const match = mentors.find(
    (m) => m.email.toLowerCase() === email.trim().toLowerCase()
  );
  return resolve(write(seedFor(match?.id ?? DEMO_MENTOR_ID)));
}

/** Onboard a professor from the "Become a mentor" form: their own profile, an
 *  empty dashboard (no courses/students/earnings) they build up themselves. */
export function registerMentor(p: {
  name: string;
  email: string;
  phone?: string;
  expertise: string;
  level?: string;
  experience: number;
  skills: string[];
  photo?: string | null;
  /** teaching qualification: cycle + highest year */
  teaching?: Teaching[];
}): MentorAccount {
  const stored: Stored = {
    id: CUSTOM_ID,
    custom: true,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "",
    major: p.expertise,
    title: p.level ? `${p.level} · ${p.expertise}` : p.expertise,
    level: p.level ?? "",
    experience: p.experience,
    skills: p.skills.join(", "),
    profilePicture: p.photo || DEFAULT_PHOTO,
    certificates: [],
    achievements: [],
    teaching: p.teaching ?? [],
    bioOverride: "",
    hourlyRate: 1500,
    availability: "Sun–Thu · 16:00–20:00",
    earnings: [],
  };
  return resolve(write(stored));
}

/** Should this login email land on the mentor dashboard? True for a seeded
 *  mentor's address, a staff @e-taalim.com address, or the currently registered
 *  professor — so login routes by role with no toggle. */
export function isMentorEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  if (e.endsWith("@e-taalim.com")) return true;
  if (mentors.some((m) => m.email.toLowerCase() === e)) return true;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw) as Stored;
        if (s.custom && s.email.toLowerCase() === e) return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function getMentorAccount(): MentorAccount {
  return resolve(read());
}

/** Update any of the mentor's public-profile fields (mirrors what students see
 *  on the mentor profile page) plus the dashboard-only rate/availability. */
export function updateMentorProfile(p: {
  title?: string;
  bioOverride?: string;
  major?: string;
  level?: string;
  experience?: number;
  phone?: string;
  skills?: string;
  certificates?: Certificate[];
  achievements?: string[];
  hourlyRate?: number;
  availability?: string;
}): MentorAccount {
  const s = read();
  if (p.title !== undefined) s.title = p.title;
  if (p.bioOverride !== undefined) s.bioOverride = p.bioOverride;
  if (p.major !== undefined) s.major = p.major;
  if (p.level !== undefined) s.level = p.level;
  if (p.experience !== undefined) s.experience = p.experience;
  if (p.phone !== undefined) s.phone = p.phone;
  if (p.skills !== undefined) s.skills = p.skills;
  if (p.certificates !== undefined) s.certificates = p.certificates;
  if (p.achievements !== undefined) s.achievements = p.achievements;
  if (p.hourlyRate !== undefined) s.hourlyRate = p.hourlyRate;
  if (p.availability !== undefined) s.availability = p.availability;
  return resolve(write(s));
}

export function totalEarnings(): number {
  return read().earnings.reduce((sum, t) => sum + t.amount, 0);
}

/** Earnings within the current calendar month (mock "this month"). */
export function monthEarnings(): number {
  const now = new Date();
  return read()
    .earnings.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, t) => sum + t.amount, 0);
}
