// Students who registered through the signup form, mirrored into a directory
// list so the admin can browse them alongside the demo dataset — including the
// parent contact captured for minors. localStorage-backed; becomes the real
// users table with the backend.
import { StudentRecord } from "@/data/students";
import { Cycle } from "@/data/education";

const KEY = "etaalim.registeredStudents";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getRegisteredStudents(): StudentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudentRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordRegistration(p: {
  name: string;
  email: string;
  phone: string;
  age: number;
  parentEmail: string;
  parentPhone: string;
  cycle: Cycle;
  year: string;
  extra: string;
}): void {
  if (typeof window === "undefined") return;
  // re-registering with the same email replaces the previous entry
  const list = getRegisteredStudents().filter(
    (s) => s.email.toLowerCase() !== p.email.toLowerCase()
  );
  list.unshift({
    id: `reg-${p.email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: p.name,
    initials: initialsOf(p.name),
    cycle: p.cycle,
    year: p.year,
    extra: p.extra,
    email: p.email,
    phone: p.phone,
    joined: new Date().toISOString(),
    enrolledCourseIds: [],
    transactions: [],
    balance: 0,
    age: p.age,
    parentEmail: p.parentEmail,
    parentPhone: p.parentPhone,
    registered: true,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getRegisteredStudent(id: string): StudentRecord | undefined {
  return getRegisteredStudents().find((s) => s.id === id);
}
