// The EFFECTIVE course catalog: the static catalog with the admin's overrides
// applied (edited fields, deleted courses, admin-created courses). Client-only
// (the overrides live in localStorage) — callers seed SSR with the static
// catalog and swap to this on mount. Becomes a single API call later.
import { courses, Course, Tier, TIERS, getTrack } from "@/data/courses";
import { getAdminCourses, AdminCourse } from "@/lib/adminCourses";

export interface EffectiveCourse extends Course {
  /** admin-written description ("" → the generated about text is used) */
  description?: string;
  /** every mentor delivering the course (mentorId = the first one) */
  mentorIds: number[];
}

/** grade number from a year code — "3AS" → 3; non-numeric (Licence…) → fallback */
function yearFromCode(code: string, fallback: number): number {
  const n = parseInt(code, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toCourse(a: AdminCourse): EffectiveCourse {
  const base = courses.find((c) => c.id === a.id);
  const track = a.track || base?.track || "";
  const code = getTrack(track)?.code ?? "";
  return {
    id: a.id,
    subject: a.subject,
    tier: (TIERS as string[]).includes(a.tier) ? (a.tier as Tier) : base?.tier ?? "High School",
    track,
    year: code ? yearFromCode(code, base?.year ?? 1) : base?.year ?? 1,
    major: a.major || base?.major || "Mathematics",
    level: a.level || base?.level || "Intermediate",
    status: a.status,
    date: a.date || base?.date || "2025-09-15",
    time: a.time || base?.time || "10:00",
    price: a.price,
    priceGroup: a.priceGroup || base?.priceGroup || a.price * 2,
    priceIndividual: a.priceIndividual || base?.priceIndividual || a.price * 4,
    mentorId: a.mentorIds[0] ?? base?.mentorId ?? 1,
    description: a.description || undefined,
    mentorIds: a.mentorIds,
  };
}

/** The live catalog exactly as the admin has shaped it. */
export function effectiveCourses(): EffectiveCourse[] {
  return getAdminCourses().map(toCourse);
}

export function effectiveCourse(id: number): EffectiveCourse | undefined {
  return effectiveCourses().find((c) => c.id === id);
}
