import { mentors } from "./mentors";

// Algerian education system model.
// Cycle (tier) → Track (a school year, or a high-school stream) → Courses.
export type Tier = "Primary" | "Middle" | "High School" | "University";
export type CourseStatus = "available" | "upcoming";

export interface Course {
  id: number;
  subject: string;
  /** education cycle */
  tier: Tier;
  /** sub-level key: a school year (p1..p5, m1..m4) or a HS stream / uni cycle */
  track: string;
  /** grade number inside the cycle (1..5 primary, 1..4 middle, 1..3 HS, uni years) */
  year: number;
  /** subject field — drives accent + generated lessons + mentor match */
  major: string;
  level: string;
  status: CourseStatus;
  date: string; // ISO date
  time: string; // HH:MM (24h)
  /** self-paced recorded course price (DZD) */
  price: number;
  /** online group revision session price (DZD) */
  priceGroup: number;
  /** one-to-one private session price (DZD) */
  priceIndividual: number;
  mentorId: number;
}

export const TIERS: Tier[] = ["Primary", "Middle", "High School", "University"];

// ===== Tracks (the second level of the drill-down) =====
export interface Track {
  key: string;
  tier: Tier;
  /** Algerian short code shown on the chip (e.g. "5AP", "4AM", "3AS") */
  code: string;
  /** true for the exam year (4AM → BEM, 3AS → BAC) */
  exam?: "BEM" | "BAC";
}

export const TRACKS: Track[] = [
  // Primary — 5 years
  { key: "p1", tier: "Primary", code: "1AP" },
  { key: "p2", tier: "Primary", code: "2AP" },
  { key: "p3", tier: "Primary", code: "3AP" },
  { key: "p4", tier: "Primary", code: "4AP" },
  { key: "p5", tier: "Primary", code: "5AP" },
  // Middle (CEM) — 4 years, 4AM → BEM
  { key: "m1", tier: "Middle", code: "1AM" },
  { key: "m2", tier: "Middle", code: "2AM" },
  { key: "m3", tier: "Middle", code: "3AM" },
  { key: "m4", tier: "Middle", code: "4AM", exam: "BEM" },
  // High school — 1AS common cores, then 2AS & 3AS streams (only 3AS → BAC)
  { key: "hs_tc_sci", tier: "High School", code: "1AS" },
  { key: "hs_tc_let", tier: "High School", code: "1AS" },
  // Experimental Sciences
  { key: "hs_exp_2as", tier: "High School", code: "2AS" },
  { key: "hs_exp_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // Mathematics
  { key: "hs_math_2as", tier: "High School", code: "2AS" },
  { key: "hs_math_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // Technical Mathematics
  { key: "hs_tech_2as", tier: "High School", code: "2AS" },
  { key: "hs_tech_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // Management & Economics
  { key: "hs_gest_2as", tier: "High School", code: "2AS" },
  { key: "hs_gest_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // Literature & Philosophy
  { key: "hs_philo_2as", tier: "High School", code: "2AS" },
  { key: "hs_philo_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // Foreign Languages
  { key: "hs_lang_2as", tier: "High School", code: "2AS" },
  { key: "hs_lang_3as", tier: "High School", code: "3AS", exam: "BAC" },
  // University (LMD)
  { key: "uni_lic", tier: "University", code: "Licence" },
  { key: "uni_mas", tier: "University", code: "Master" },
  { key: "uni_doc", tier: "University", code: "Doctorat" },
];

export function tracksForTier(tier: Tier): Track[] {
  return TRACKS.filter((t) => t.tier === tier);
}

export function getTrack(key: string): Track | undefined {
  return TRACKS.find((t) => t.key === key);
}

// ===== Drill-down navigation tree =====
// The year/stream selector on the courses page. Most tiers are a single flat
// level, but High School drills: year (1AS/2AS/3AS) → branch → stream.
export interface NavNode {
  /** unique id, used in the selected path */
  key: string;
  /** short code chip (e.g. "1AS", "Licence"); omitted for branch/stream nodes */
  code?: string;
  /** i18n label key under coursesPage.nav.* */
  label: string;
  /** exam tag shown on the chip / breadcrumb */
  exam?: "BEM" | "BAC";
  /** leaf nodes point at the course.track values they select */
  tracks?: string[];
  /** branch nodes drill one level deeper */
  children?: NavNode[];
}

export const NAV_TREE: Record<Tier, NavNode[]> = {
  Primary: [
    { key: "p1", code: "1AP", label: "p1", tracks: ["p1"] },
    { key: "p2", code: "2AP", label: "p2", tracks: ["p2"] },
    { key: "p3", code: "3AP", label: "p3", tracks: ["p3"] },
    { key: "p4", code: "4AP", label: "p4", tracks: ["p4"] },
    { key: "p5", code: "5AP", label: "p5", tracks: ["p5"] },
  ],
  Middle: [
    { key: "m1", code: "1AM", label: "m1", tracks: ["m1"] },
    { key: "m2", code: "2AM", label: "m2", tracks: ["m2"] },
    { key: "m3", code: "3AM", label: "m3", tracks: ["m3"] },
    { key: "m4", code: "4AM", label: "m4", exam: "BEM", tracks: ["m4"] },
  ],
  "High School": [
    {
      key: "1as",
      code: "1AS",
      label: "y1as",
      children: [
        { key: "1as_sci", label: "sciences", tracks: ["hs_tc_sci"] },
        { key: "1as_let", label: "lettres", tracks: ["hs_tc_let"] },
      ],
    },
    {
      key: "2as",
      code: "2AS",
      label: "y2as",
      children: [
        {
          key: "2as_sci",
          label: "sciences",
          children: [
            { key: "hs_exp_2as", label: "hs_exp", tracks: ["hs_exp_2as"] },
            { key: "hs_math_2as", label: "hs_math", tracks: ["hs_math_2as"] },
            { key: "hs_tech_2as", label: "hs_tech", tracks: ["hs_tech_2as"] },
          ],
        },
        {
          key: "2as_let",
          label: "lettres",
          children: [
            { key: "hs_philo_2as", label: "hs_philo", tracks: ["hs_philo_2as"] },
            { key: "hs_lang_2as", label: "hs_lang", tracks: ["hs_lang_2as"] },
          ],
        },
        { key: "2as_gest", label: "gestion", tracks: ["hs_gest_2as"] },
      ],
    },
    {
      key: "3as",
      code: "3AS",
      label: "y3as",
      exam: "BAC",
      children: [
        {
          key: "3as_sci",
          label: "sciences",
          children: [
            { key: "hs_exp_3as", label: "hs_exp", tracks: ["hs_exp_3as"] },
            { key: "hs_math_3as", label: "hs_math", tracks: ["hs_math_3as"] },
            { key: "hs_tech_3as", label: "hs_tech", tracks: ["hs_tech_3as"] },
          ],
        },
        {
          key: "3as_let",
          label: "lettres",
          children: [
            { key: "hs_philo_3as", label: "hs_philo", tracks: ["hs_philo_3as"] },
            { key: "hs_lang_3as", label: "hs_lang", tracks: ["hs_lang_3as"] },
          ],
        },
        { key: "3as_gest", label: "gestion", tracks: ["hs_gest_3as"] },
      ],
    },
  ],
  University: [
    { key: "uni_lic", code: "Licence", label: "uni_lic", tracks: ["uni_lic"] },
    { key: "uni_mas", code: "Master", label: "uni_mas", tracks: ["uni_mas"] },
    { key: "uni_doc", code: "Doctorat", label: "uni_doc", tracks: ["uni_doc"] },
  ],
};

export function navRoots(tier: Tier): NavNode[] {
  return NAV_TREE[tier] ?? [];
}

/** Resolve a path of node keys into the matching NavNode chain. */
export function resolveNavPath(tier: Tier, path: string[]): NavNode[] {
  const chain: NavNode[] = [];
  let level = navRoots(tier);
  for (const key of path) {
    const found = level.find((n) => n.key === key);
    if (!found) break;
    chain.push(found);
    level = found.children ?? [];
  }
  return chain;
}

/** All course.track values reachable under a node (recursively). */
export function leafTracks(node: NavNode): string[] {
  if (node.tracks) return node.tracks;
  if (node.children) return node.children.flatMap(leafTracks);
  return [];
}

// ===== Course list (Algerian curriculum) =====
const PRICE: Record<Tier, [number, number, number]> = {
  Primary: [1200, 2500, 5000],
  Middle: [1600, 3000, 6000],
  "High School": [2200, 4000, 8000],
  University: [2800, 5000, 10000],
};

const LEVEL_BY_TIER: Record<Tier, string> = {
  Primary: "Beginner",
  Middle: "Intermediate",
  "High School": "Advanced",
  University: "Advanced",
};

const MENTOR_BY_MAJOR: Record<string, number> = {
  Mathematics: 1,
  Physics: 2,
  Technology: 2,
  "Computer Science": 3,
  Chemistry: 4,
  Biology: 5,
  "Natural Sciences": 5,
  English: 6,
  "Foreign Languages": 6,
  French: 7,
  Economics: 8,
  Accounting: 8,
  History: 9,
  Philosophy: 9,
  Arabic: 9,
};

const DATES = ["2025-09-15", "2025-09-22", "2025-10-01", "2025-10-08", "2025-10-15", "2025-10-22"];
const TIMES = ["09:00", "10:30", "14:00", "16:00", "11:00"];

let _id = 0;
function mk(subject: string, tier: Tier, track: string, year: number, major: string): Course {
  _id += 1;
  const [price, priceGroup, priceIndividual] = PRICE[tier];
  return {
    id: _id,
    subject,
    tier,
    track,
    year,
    major,
    level: LEVEL_BY_TIER[tier],
    status: _id % 6 === 0 ? "upcoming" : "available",
    date: DATES[_id % DATES.length],
    time: TIMES[_id % TIMES.length],
    price,
    priceGroup,
    priceIndividual,
    mentorId: MENTOR_BY_MAJOR[major] ?? 1,
  };
}

export const courses: Course[] = [
  // ===== Primary =====
  mk("Arabic Language", "Primary", "p1", 1, "Arabic"),
  mk("Mathematics", "Primary", "p1", 1, "Mathematics"),
  mk("Arabic Language", "Primary", "p2", 2, "Arabic"),
  mk("Mathematics", "Primary", "p2", 2, "Mathematics"),
  mk("Arabic Language", "Primary", "p3", 3, "Arabic"),
  mk("Mathematics", "Primary", "p3", 3, "Mathematics"),
  mk("French Language", "Primary", "p3", 3, "French"),
  mk("Mathematics", "Primary", "p4", 4, "Mathematics"),
  mk("French Language", "Primary", "p4", 4, "French"),
  mk("English", "Primary", "p4", 4, "English"),
  mk("Arabic Language", "Primary", "p5", 5, "Arabic"),
  mk("Mathematics", "Primary", "p5", 5, "Mathematics"),
  mk("French Language", "Primary", "p5", 5, "French"),

  // ===== Middle (CEM) =====
  mk("Arabic Language", "Middle", "m1", 1, "Arabic"),
  mk("Mathematics", "Middle", "m1", 1, "Mathematics"),
  mk("French Language", "Middle", "m1", 1, "French"),
  mk("English", "Middle", "m1", 1, "English"),
  mk("Mathematics", "Middle", "m2", 2, "Mathematics"),
  mk("Physics", "Middle", "m2", 2, "Physics"),
  mk("French Language", "Middle", "m2", 2, "French"),
  mk("Mathematics", "Middle", "m3", 3, "Mathematics"),
  mk("Natural Sciences", "Middle", "m3", 3, "Natural Sciences"),
  mk("English", "Middle", "m3", 3, "English"),
  mk("Mathematics", "Middle", "m4", 4, "Mathematics"),
  mk("Physics", "Middle", "m4", 4, "Physics"),
  mk("Arabic Language", "Middle", "m4", 4, "Arabic"),

  // ===== High school — 1AS common cores =====
  mk("Mathematics", "High School", "hs_tc_sci", 1, "Mathematics"),
  mk("Physics", "High School", "hs_tc_sci", 1, "Physics"),
  mk("Natural Sciences", "High School", "hs_tc_sci", 1, "Natural Sciences"),
  mk("Arabic Language", "High School", "hs_tc_let", 1, "Arabic"),
  mk("French Language", "High School", "hs_tc_let", 1, "French"),
  mk("History & Geography", "High School", "hs_tc_let", 1, "History"),

  // ===== High school — 2AS streams =====
  // Experimental Sciences
  mk("Natural Sciences", "High School", "hs_exp_2as", 2, "Natural Sciences"),
  mk("Physics", "High School", "hs_exp_2as", 2, "Physics"),
  mk("Mathematics", "High School", "hs_exp_2as", 2, "Mathematics"),
  // Mathematics
  mk("Mathematics", "High School", "hs_math_2as", 2, "Mathematics"),
  mk("Physics", "High School", "hs_math_2as", 2, "Physics"),
  // Technical Mathematics
  mk("Mathematics", "High School", "hs_tech_2as", 2, "Mathematics"),
  mk("Technology", "High School", "hs_tech_2as", 2, "Technology"),
  mk("Physics", "High School", "hs_tech_2as", 2, "Physics"),
  // Management & Economics
  mk("Economics & Management", "High School", "hs_gest_2as", 2, "Economics"),
  mk("Accounting", "High School", "hs_gest_2as", 2, "Accounting"),
  mk("Mathematics", "High School", "hs_gest_2as", 2, "Mathematics"),
  // Literature & Philosophy
  mk("Philosophy", "High School", "hs_philo_2as", 2, "Philosophy"),
  mk("Arabic Language", "High School", "hs_philo_2as", 2, "Arabic"),
  mk("History & Geography", "High School", "hs_philo_2as", 2, "History"),
  // Foreign Languages
  mk("English", "High School", "hs_lang_2as", 2, "English"),
  mk("French Language", "High School", "hs_lang_2as", 2, "French"),
  mk("Foreign Languages", "High School", "hs_lang_2as", 2, "Foreign Languages"),

  // ===== High school — 3AS streams (exam year → BAC) =====
  // Experimental Sciences
  mk("Natural Sciences", "High School", "hs_exp_3as", 3, "Natural Sciences"),
  mk("Physics", "High School", "hs_exp_3as", 3, "Physics"),
  mk("Mathematics", "High School", "hs_exp_3as", 3, "Mathematics"),
  // Mathematics
  mk("Mathematics", "High School", "hs_math_3as", 3, "Mathematics"),
  mk("Physics", "High School", "hs_math_3as", 3, "Physics"),
  // Technical Mathematics
  mk("Mathematics", "High School", "hs_tech_3as", 3, "Mathematics"),
  mk("Technology", "High School", "hs_tech_3as", 3, "Technology"),
  mk("Physics", "High School", "hs_tech_3as", 3, "Physics"),
  // Management & Economics
  mk("Economics & Management", "High School", "hs_gest_3as", 3, "Economics"),
  mk("Accounting", "High School", "hs_gest_3as", 3, "Accounting"),
  mk("Mathematics", "High School", "hs_gest_3as", 3, "Mathematics"),
  // Literature & Philosophy
  mk("Philosophy", "High School", "hs_philo_3as", 3, "Philosophy"),
  mk("Arabic Language", "High School", "hs_philo_3as", 3, "Arabic"),
  mk("History & Geography", "High School", "hs_philo_3as", 3, "History"),
  // Foreign Languages
  mk("English", "High School", "hs_lang_3as", 3, "English"),
  mk("French Language", "High School", "hs_lang_3as", 3, "French"),
  mk("Foreign Languages", "High School", "hs_lang_3as", 3, "Foreign Languages"),

  // ===== University (LMD) =====
  mk("Computer Science", "University", "uni_lic", 1, "Computer Science"),
  mk("Mathematics", "University", "uni_lic", 1, "Mathematics"),
  mk("Economics & Management", "University", "uni_lic", 1, "Economics"),
  mk("Computer Science", "University", "uni_mas", 4, "Computer Science"),
  mk("Mathematics", "University", "uni_mas", 4, "Mathematics"),
  mk("Computer Science", "University", "uni_doc", 6, "Computer Science"),
];

export function mentorName(mentorId: number): string {
  return mentors.find((m) => m.id === mentorId)?.name ?? "Unknown";
}

export interface CourseFilters {
  search?: string;
  tier?: string;
  /** limit to these course.track values (empty/undefined = no track filter) */
  tracks?: string[];
}

export function filterCourses(filters: CourseFilters): Course[] {
  const search = (filters.search ?? "").trim().toLowerCase();
  const tier = filters.tier ?? "";
  const tracks = filters.tracks ?? [];

  return courses.filter((c) => {
    if (tier !== "" && tier !== "All" && c.tier !== tier) return false;
    if (tracks.length > 0 && !tracks.includes(c.track)) return false;
    if (
      search !== "" &&
      !c.subject.toLowerCase().includes(search) &&
      !c.major.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });
}

export function getCourseById(id: number): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getCoursesByMentor(mentorId: number): Course[] {
  return courses.filter((c) => c.mentorId === mentorId);
}

export function getRelatedCourses(
  mentorId: number,
  excludeId: number,
  limit = 3
): Course[] {
  return courses
    .filter((c) => c.mentorId === mentorId && c.id !== excludeId)
    .slice(0, limit);
}

// Lessons generated from the course major.
export function getLessonsForMajor(major: string): string[] {
  switch (major.toLowerCase()) {
    case "mathematics":
      return ["Algebra", "Geometry", "Calculus", "Statistics"];
    case "physics":
      return ["Mechanics", "Electricity", "Waves", "Thermodynamics"];
    case "chemistry":
      return ["Atomic Structure", "Reactions", "Organic Chemistry", "Lab Work"];
    case "biology":
    case "natural sciences":
      return ["Cells", "Genetics", "Human Body", "Ecology"];
    case "computer science":
      return ["Programming Basics", "Data Structures", "Databases", "Projects"];
    case "economics":
    case "accounting":
      return ["Core Concepts", "Advanced Topics", "Practical Applications", "Practice"];
    case "english":
    case "french":
    case "arabic":
    case "foreign languages":
      return ["Grammar", "Vocabulary", "Conversation", "Writing"];
    default:
      return ["Introduction", "Core Concepts", "Advanced Topics", "Practice"];
  }
}

// ===== Formatting helpers =====
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// Algerian Dinar, e.g. 2500 -> "2 500 DA"
export function formatDZD(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " DA";
}

// ===== Join / session options =====
export type JoinMode = "recorded" | "group" | "individual";

export interface JoinOption {
  mode: JoinMode;
  title: string;
  desc: string;
  icon: string; // Font Awesome 4 icon
  price: number; // DZD
}

export function getJoinOptions(course: Course): JoinOption[] {
  return [
    {
      mode: "recorded",
      title: "Watch Recorded",
      desc: "Full pre-recorded lessons you can watch anytime, at your own pace.",
      icon: "fa-play-circle",
      price: course.price,
    },
    {
      mode: "group",
      title: "Online Group Session",
      desc: "Live revision session with a teacher and other students in the same module.",
      icon: "fa-users",
      price: course.priceGroup,
    },
    {
      mode: "individual",
      title: "Private 1-on-1 Session",
      desc: "A personalised individual session with the teacher, just for you.",
      icon: "fa-user",
      price: course.priceIndividual,
    },
  ];
}

export function getJoinOption(course: Course, mode: JoinMode): JoinOption {
  return getJoinOptions(course).find((o) => o.mode === mode) ?? getJoinOptions(course)[0];
}
