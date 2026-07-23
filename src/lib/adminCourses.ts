// Admin course management, localStorage-backed (mock until Supabase). An
// overlay on top of the static catalog that lets the admin add, edit, delete,
// and — importantly — assign SEVERAL mentors to the same course (students then
// pick the mentor they prefer). Swap the internals for API calls later.
import { courses, Course, getTrack } from "@/data/courses";

export interface AdminCourseInput {
  subject: string;
  description: string;
  major: string;
  tier: string;
  /**
   * Catalog track key (p1…p5, m1…m4, hs_exp_2as…, uni_lic); "" if not set.
   * For high school this carries the STREAM, not just the year — 1AS splits
   * into Science/Letters common cores, 2AS/3AS into the five/six streams,
   * exactly like the student-facing courses page.
   */
  track: string;
  level: string;
  price: number; // self-paced recorded price (DZD)
  priceGroup: number; // online group session (DZD)
  priceIndividual: number; // private 1-on-1 session (DZD)
  date: string; // ISO start date, "" if unscheduled
  time: string; // HH:MM (24h)
  status: "available" | "upcoming";
  mentorIds: number[]; // one or more mentors delivering this course
}

export interface AdminCourse extends AdminCourseInput {
  id: number;
  /** derived from `track`: Algerian year code (1AP, 4AM, 3AS, Licence…) */
  yearCode: string;
  custom?: boolean; // admin-created (subject shown as typed)
}

function codeOf(track: string): string {
  return getTrack(track)?.code ?? "";
}

const KEY = "etaalim.adminCourses";

interface Store {
  added: AdminCourse[];
  deleted: number[];
  // partial field overrides for base (catalog) courses, incl. mentorIds
  overrides: Record<number, Partial<AdminCourseInput>>;
}

function empty(): Store {
  return { added: [], deleted: [], overrides: {} };
}

function read(): Store {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...(JSON.parse(raw) as Store) } : empty();
  } catch {
    return empty();
  }
}

function write(s: Store): Store {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
  return s;
}

function baseToAdmin(c: Course, ov?: Partial<AdminCourseInput>): AdminCourse {
  return {
    id: c.id,
    subject: ov?.subject ?? c.subject,
    description: ov?.description ?? "",
    major: ov?.major ?? c.major,
    tier: ov?.tier ?? c.tier,
    track: ov?.track ?? c.track,
    yearCode: codeOf(ov?.track ?? c.track),
    level: ov?.level ?? c.level,
    price: ov?.price ?? c.price,
    priceGroup: ov?.priceGroup ?? c.priceGroup,
    priceIndividual: ov?.priceIndividual ?? c.priceIndividual,
    date: ov?.date ?? c.date,
    time: ov?.time ?? c.time,
    status: ov?.status ?? c.status,
    mentorIds: ov?.mentorIds ?? [c.mentorId],
  };
}

// Fills fields that may be missing from courses saved by an older version.
function withDefaults(c: AdminCourse): AdminCourse {
  const track = c.track ?? "";
  return {
    ...c,
    track,
    // track drives the code; legacy entries without one keep their stored code
    yearCode: track ? codeOf(track) : (c.yearCode ?? ""),
    priceGroup: c.priceGroup ?? 0,
    priceIndividual: c.priceIndividual ?? 0,
    date: c.date ?? "",
    time: c.time ?? "",
  };
}

/** The effective course list: catalog (minus deleted, plus overrides) + added. */
export function getAdminCourses(): AdminCourse[] {
  const s = read();
  const base = courses
    .filter((c) => !s.deleted.includes(c.id))
    .map((c) => baseToAdmin(c, s.overrides[c.id]));
  return [...s.added.map(withDefaults), ...base];
}

export function getAdminCourse(id: number): AdminCourse | undefined {
  return getAdminCourses().find((c) => c.id === id);
}

export function addAdminCourse(input: AdminCourseInput): AdminCourse[] {
  const s = read();
  s.added.unshift({
    id: 2_000_000 + Math.floor(Math.random() * 1_000_000),
    ...input,
    yearCode: codeOf(input.track),
    custom: true,
  });
  write(s);
  return getAdminCourses();
}

export function updateAdminCourse(
  id: number,
  input: Partial<AdminCourseInput>
): AdminCourse[] {
  const s = read();
  const idx = s.added.findIndex((c) => c.id === id);
  if (idx >= 0) {
    s.added[idx] = { ...s.added[idx], ...input };
    if (input.track !== undefined) {
      s.added[idx].yearCode = codeOf(input.track);
    }
  } else {
    s.overrides[id] = { ...s.overrides[id], ...input };
  }
  write(s);
  return getAdminCourses();
}

export function deleteAdminCourse(id: number): AdminCourse[] {
  const s = read();
  const idx = s.added.findIndex((c) => c.id === id);
  if (idx >= 0) {
    s.added.splice(idx, 1);
    delete s.overrides[id];
  } else if (!s.deleted.includes(id)) {
    s.deleted.push(id);
    delete s.overrides[id];
  }
  write(s);
  return getAdminCourses();
}

export function assignMentor(id: number, mentorId: number): AdminCourse[] {
  const ids = getAdminCourse(id)?.mentorIds ?? [];
  if (ids.includes(mentorId)) return getAdminCourses();
  return updateAdminCourse(id, { mentorIds: [...ids, mentorId] });
}

export function unassignMentor(id: number, mentorId: number): AdminCourse[] {
  const ids = (getAdminCourse(id)?.mentorIds ?? []).filter((m) => m !== mentorId);
  return updateAdminCourse(id, { mentorIds: ids });
}
