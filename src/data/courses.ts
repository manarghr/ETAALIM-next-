import { mentors } from "./mentors";

export type Tier = "Primary" | "Middle" | "High School" | "University";
export type CourseStatus = "available" | "upcoming";

export interface Course {
  id: number;
  subject: string;
  date: string; // ISO date
  time: string; // HH:MM (24h)
  major: string;
  level: string;
  tier: Tier;
  status: CourseStatus;
  /** self-paced recorded course price (DZD) */
  price: number;
  /** online group revision session price (DZD) */
  priceGroup: number;
  /** one-to-one private session price (DZD) */
  priceIndividual: number;
  mentorId: number;
}

// Demo courses — prices in Algerian Dinar (DZD). Replace with a real API later.
export const courses: Course[] = [
  { id: 1,  subject: "Arabic Language",          date: "2025-09-15", time: "10:00", major: "Arabic",           level: "Beginner",     tier: "Primary",     status: "available", price: 1200, priceGroup: 2500, priceIndividual: 5000, mentorId: 6 },
  { id: 2,  subject: "Primary Mathematics",      date: "2025-09-18", time: "11:00", major: "Mathematics",      level: "Beginner",     tier: "Primary",     status: "available", price: 1200, priceGroup: 2500, priceIndividual: 5000, mentorId: 1 },
  { id: 3,  subject: "Beginner French",          date: "2025-09-20", time: "14:00", major: "French",           level: "Beginner",     tier: "Primary",     status: "upcoming",  price: 1300, priceGroup: 2600, priceIndividual: 5200, mentorId: 7 },
  { id: 4,  subject: "Middle-School Mathematics",date: "2025-09-22", time: "09:30", major: "Mathematics",      level: "Intermediate", tier: "Middle",      status: "available", price: 1600, priceGroup: 3000, priceIndividual: 6000, mentorId: 1 },
  { id: 5,  subject: "General Science (BEM)",     date: "2025-09-25", time: "16:00", major: "Physics",          level: "Intermediate", tier: "Middle",      status: "available", price: 1600, priceGroup: 3000, priceIndividual: 6000, mentorId: 2 },
  { id: 6,  subject: "English for Middle School", date: "2025-10-01", time: "17:00", major: "English",          level: "Intermediate", tier: "Middle",      status: "upcoming",  price: 1500, priceGroup: 2800, priceIndividual: 5600, mentorId: 6 },
  { id: 7,  subject: "Algebra & Analysis (BAC)",  date: "2025-10-03", time: "10:00", major: "Mathematics",      level: "Advanced",     tier: "High School", status: "available", price: 2200, priceGroup: 4000, priceIndividual: 8000, mentorId: 1 },
  { id: 8,  subject: "Classical Mechanics",       date: "2025-10-05", time: "09:30", major: "Physics",          level: "Advanced",     tier: "High School", status: "available", price: 2200, priceGroup: 4000, priceIndividual: 8000, mentorId: 2 },
  { id: 9,  subject: "Organic Chemistry (BAC)",   date: "2025-10-08", time: "13:00", major: "Chemistry",        level: "Advanced",     tier: "High School", status: "upcoming",  price: 2300, priceGroup: 4200, priceIndividual: 8400, mentorId: 4 },
  { id: 10, subject: "Cell Biology (BAC)",        date: "2025-10-10", time: "15:30", major: "Biology",          level: "Advanced",     tier: "High School", status: "available", price: 2200, priceGroup: 4000, priceIndividual: 8000, mentorId: 5 },
  { id: 11, subject: "Calculus I",                date: "2025-10-12", time: "14:00", major: "Mathematics",      level: "Intermediate", tier: "University",  status: "available", price: 2800, priceGroup: 5000, priceIndividual: 10000, mentorId: 1 },
  { id: 12, subject: "Intro to Python",           date: "2025-10-15", time: "16:00", major: "Computer Science", level: "Beginner",     tier: "University",  status: "available", price: 2800, priceGroup: 5000, priceIndividual: 10000, mentorId: 3 },
  { id: 13, subject: "Web Development Basics",     date: "2025-10-18", time: "11:00", major: "Computer Science", level: "Beginner",     tier: "University",  status: "upcoming",  price: 3000, priceGroup: 5500, priceIndividual: 11000, mentorId: 3 },
  { id: 14, subject: "Principles of Economics",   date: "2025-10-20", time: "13:00", major: "Economics",        level: "Intermediate", tier: "University",  status: "available", price: 2900, priceGroup: 5200, priceIndividual: 10500, mentorId: 8 },
];

export const TIERS: Tier[] = ["Primary", "Middle", "High School", "University"];

export function mentorName(mentorId: number): string {
  return mentors.find((m) => m.id === mentorId)?.name ?? "Unknown";
}

export interface CourseFilters {
  search?: string;
  major?: string;
  level?: string;
  tier?: string;
}

export function filterCourses(filters: CourseFilters): Course[] {
  const search = (filters.search ?? "").trim().toLowerCase();
  const major = filters.major ?? "";
  const level = filters.level ?? "";
  const tier = filters.tier ?? "";

  return courses.filter((c) => {
    if (tier !== "" && tier !== "All" && c.tier !== tier) return false;
    if (
      search !== "" &&
      !c.subject.toLowerCase().includes(search) &&
      !c.major.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (major !== "" && major !== "All Categories" && c.major !== major) {
      return false;
    }
    if (level !== "" && level !== "All Levels" && c.level !== level) {
      return false;
    }
    return true;
  });
}

export function getMajors(): string[] {
  return Array.from(new Set(courses.map((c) => c.major))).sort();
}

export function getLevels(): string[] {
  return Array.from(new Set(courses.map((c) => c.level))).sort();
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
      return ["Cells", "Genetics", "Human Body", "Ecology"];
    case "computer science":
      return ["Programming Basics", "Data Structures", "Databases", "Projects"];
    case "english":
    case "french":
    case "arabic":
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
