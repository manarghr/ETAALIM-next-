// Deterministic demo student roster for the mentor dashboard. Real Algerian
// first/last names so the "Students" list and earnings feed look believable
// without a backend. Everything is derived from ids, so it's stable across
// renders and SSR-safe.
const FIRST = [
  "Yasmine", "Mohamed", "Ines", "Rayan", "Lina", "Adem", "Sara", "Bilal",
  "Nour", "Anis", "Meriem", "Ilyes", "Amira", "Yanis", "Rania", "Zakaria",
];
const LAST = [
  "Cherif", "Amrani", "Boudjelal", "Saidi", "Hadj", "Belkhir", "Toumi",
  "Meziane", "Khaldi", "Ferhat", "Slimani", "Bouras", "Charef", "Rahmani",
];

export interface Enrollee {
  id: string;
  name: string;
  initials: string;
  joined: string; // ISO date
  /** lesson progress %, deterministic */
  progress: number;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** A believable enrolled-student list for a course (deterministic by id). */
export function getRoster(courseId: number): Enrollee[] {
  const count = 3 + ((courseId * 7) % 6); // 3–8 students
  const out: Enrollee[] = [];
  for (let i = 0; i < count; i++) {
    const f = FIRST[(courseId * 3 + i * 5) % FIRST.length];
    const l = LAST[(courseId * 2 + i * 3) % LAST.length];
    const name = `${f} ${l}`;
    out.push({
      id: `s-${courseId}-${i}`,
      name,
      initials: initialsOf(name),
      joined: new Date(2026, 4 + (i % 3), 1 + ((courseId + i) % 27)).toISOString(),
      progress: 10 + ((courseId * 13 + i * 29) % 85),
    });
  }
  return out;
}

/** Total unique-ish student count across a set of course ids. */
export function totalStudents(courseIds: number[]): number {
  return courseIds.reduce((sum, id) => sum + getRoster(id).length, 0);
}
