// A deterministic global student directory for the admin dashboard. Real
// platforms read this from the DB; here it's generated once from the Algerian
// education structure + the course catalog so the admin can browse everyone
// (grouped by level → year), search, and open a full student profile. Stable
// across renders/SSR (no Date.now / Math.random).
import { YEARS, streamsForYear, Cycle } from "./education";
import { courses } from "./courses";

export interface StudentTx {
  id: string;
  type: "topup" | "purchase";
  subject?: string; // English course subject for purchases (translated at render)
  amount: number; // DZD
  date: string; // ISO
}

export interface StudentRecord {
  id: string;
  name: string;
  initials: string;
  cycle: Cycle;
  year: string; // "3AP", "1AS", "L2", …
  /** stream (high school, English) or major (university, free text); "" otherwise */
  extra: string;
  email: string;
  phone: string;
  joined: string; // ISO
  enrolledCourseIds: number[];
  transactions: StudentTx[];
  balance: number; // DZD
  // --- captured at signup for real registrations (absent on the demo seed) ---
  age?: number;
  parentEmail?: string;
  parentPhone?: string;
  /** true for accounts created through the signup form */
  registered?: boolean;
}

export const CYCLE_ORDER: Cycle[] = ["primary", "middle", "high", "university"];

const TIER_FOR_CYCLE: Record<Cycle, string> = {
  primary: "Primary",
  middle: "Middle",
  high: "High School",
  university: "University",
};

const FIRST = [
  "Yasmine", "Mohamed", "Ines", "Rayan", "Lina", "Adem", "Sara", "Bilal",
  "Nour", "Anis", "Meriem", "Ilyes", "Amira", "Yanis", "Rania", "Zakaria",
  "Manel", "Oussama", "Hiba", "Aymen", "Kenza", "Sofiane", "Wafa", "Nassim",
];
const LAST = [
  "Cherif", "Amrani", "Boudjelal", "Saidi", "Hadj", "Belkhir", "Toumi",
  "Meziane", "Khaldi", "Ferhat", "Slimani", "Bouras", "Charef", "Rahmani",
  "Benali", "Haddad", "Mansouri", "Belkacem", "Ouali", "Zerrouki",
];
const UNI_MAJORS = [
  "Computer Science", "Medicine", "Law", "Economics", "Civil Engineering",
  "Biology", "Mathematics", "Architecture", "Psychology", "Business Management",
];

function hash(s: string): number {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0;
  return x;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dateFor(idx: number, k: number): string {
  const month = (idx + k) % 8; // Jan–Aug 2026
  const day = 1 + ((idx * 3 + k * 5) % 27);
  return new Date(2026, month, day).toISOString();
}

function build(): StudentRecord[] {
  const out: StudentRecord[] = [];
  let idx = 0;

  for (const cycle of CYCLE_ORDER) {
    const tierCourses = courses.filter(
      (c) => c.tier === TIER_FOR_CYCLE[cycle]
    );
    for (const year of YEARS[cycle]) {
      const seed = hash(cycle + year);
      const count = 5 + (seed % 8); // 5–12 students per year
      for (let i = 0; i < count; i++) {
        const first = FIRST[(idx * 7 + 3) % FIRST.length];
        const last = LAST[(idx * 5 + 1) % LAST.length];
        const name = `${first} ${last}`;

        const extra =
          cycle === "high"
            ? streamsForYear(year)[idx % streamsForYear(year).length]
            : cycle === "university"
            ? UNI_MAJORS[(idx * 3) % UNI_MAJORS.length]
            : "";

        // Enrolled courses: 1–4 from the matching tier.
        const enrolled = new Set<number>();
        if (tierCourses.length) {
          const n = 1 + ((seed + i) % Math.min(4, tierCourses.length));
          for (let k = 0; k < n; k++) {
            enrolled.add(tierCourses[(idx * 3 + k * 7) % tierCourses.length].id);
          }
        }
        const enrolledIds = [...enrolled];

        // Transactions: a top-up, then a purchase per enrolled course.
        const txs: StudentTx[] = [];
        const topup = 3000 + (seed % 4) * 1000;
        txs.push({ id: `t-${idx}`, type: "topup", amount: topup, date: dateFor(idx, 0) });
        let balance = topup;
        enrolledIds.forEach((cid, k) => {
          const c = courses.find((x) => x.id === cid);
          const price = c ? c.price : 1000;
          txs.push({
            id: `p-${idx}-${k}`,
            type: "purchase",
            subject: c?.subject,
            amount: price,
            date: dateFor(idx, k + 1),
          });
          balance -= price;
        });

        out.push({
          id: `stu-${idx}`,
          name,
          initials: initialsOf(name),
          cycle,
          year,
          extra,
          email: `${first}.${last}`.toLowerCase() + `@student.e-taalim.com`,
          phone: `+213 5${idx % 9} ${(10 + (idx * 7) % 89)} ${(10 + (idx * 3) % 89)} ${(10 + (idx * 5) % 89)}`,
          joined: dateFor(idx, 0),
          enrolledCourseIds: enrolledIds,
          transactions: txs,
          balance: Math.max(0, balance),
        });
        idx++;
      }
    }
  }
  return out;
}

export const students: StudentRecord[] = build();

/** Count of students in a cycle. */
export function countByCycle(cycle: Cycle): number {
  return students.filter((s) => s.cycle === cycle).length;
}

/** Count of students in a specific year (e.g. "3AS"). */
export function countByYear(cycle: Cycle, year: string): number {
  return students.filter((s) => s.cycle === cycle && s.year === year).length;
}

export function totalEnrollments(): number {
  return students.reduce((sum, s) => sum + s.enrolledCourseIds.length, 0);
}
