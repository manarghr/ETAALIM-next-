// Demo student account (profile + wallet + followed mentors), localStorage-backed.
// Swap the read/write internals for API calls when the backend lands; callers
// (the dashboard) stay unchanged.
export interface WalletTx {
  id: string;
  type: "topup" | "purchase";
  amount: number; // DZD, always positive
  /**
   * Course subject for purchases (topups have none). We store the English
   * subject rather than a finished label so the row re-renders in whatever
   * language is active — a stored sentence would stay frozen in one language.
   */
  subject?: string;
  /** Legacy English label from sessions stored before the i18n change. */
  label?: string;
  date: string; // ISO
}

export interface Student {
  id: number;
  name: string;
  email: string;
  initials: string;
  grade: string; // legacy display string; new signups use the education* fields
  age: number;
  parentEmail: string;
  /** student's own phone (from signup) */
  phone?: string;
  /** parent/guardian phone — captured for minors at signup */
  parentPhone?: string;
  // Structured education captured at signup (Algerian system). Optional so the
  // demo seed and older records still work; the dashboard composes a localized
  // label from these when present, else falls back to `grade`.
  educationCycle?: string; // "primary" | "middle" | "high" | "university"
  educationYear?: string; // "3AS", "5AP", "L2", …
  educationExtra?: string; // stream (high) or typed major (university)
  balance: number; // DZD
  followedMentorIds: number[];
  favoriteCourseIds: number[];
  wallet: WalletTx[];
  joined: string; // ISO
}

const KEY = "etaalim.student";

const DEMO: Student = {
  id: 1,
  name: "Yasmine Cherif",
  email: "yasmine.cherif@example.com",
  initials: "YC",
  grade: "3AS · Experimental Sciences",
  age: 16, // minor → parental-consent flow is demonstrable
  parentEmail: "parent.cherif@example.com",
  balance: 6000,
  followedMentorIds: [1, 2, 5],
  favoriteCourseIds: [],
  wallet: [
    {
      id: "seed-topup",
      type: "topup",
      amount: 6000,
      date: "2026-07-10T10:00:00.000Z",
    },
  ],
  joined: "2026-06-01T00:00:00.000Z",
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function read(): Student {
  if (typeof window === "undefined") return DEMO;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(DEMO));
      return DEMO;
    }
    return { ...DEMO, ...(JSON.parse(raw) as Partial<Student>) };
  } catch {
    return DEMO;
  }
}

function write(s: Student): Student {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }
  return s;
}

export function getStudent(): Student {
  return read();
}

function initialsOf(name: string): string {
  return (name || "S")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Sync the profile name/email from the logged-in session. */
export function setIdentity(name: string, email: string): Student {
  const s = read();
  if (name) s.name = name;
  if (email) s.email = email;
  s.initials = initialsOf(s.name);
  return write(s);
}

/** Full profile captured at sign-up: identity, age, and Algerian education. */
export function setSignupProfile(p: {
  name: string;
  email: string;
  age: number;
  phone?: string;
  parentEmail?: string;
  parentPhone?: string;
  cycle: string;
  year: string;
  extra: string;
}): Student {
  const s = read();
  s.name = p.name || s.name;
  s.email = p.email || s.email;
  s.age = p.age;
  if (p.phone) s.phone = p.phone;
  // Only minors need parent contact details; keep any existing ones otherwise.
  if (p.parentEmail) s.parentEmail = p.parentEmail;
  if (p.parentPhone) s.parentPhone = p.parentPhone;
  s.educationCycle = p.cycle;
  s.educationYear = p.year;
  s.educationExtra = p.extra;
  s.initials = initialsOf(s.name);
  return write(s);
}

export function isMinor(s: Student): boolean {
  return s.age < 18;
}

export function addFunds(amount: number): Student {
  const s = read();
  s.balance += amount;
  s.wallet = [
    { id: uid(), type: "topup", amount, date: new Date().toISOString() },
    ...s.wallet,
  ];
  return write(s);
}

/**
 * Deduct from the wallet. `subject` is the English course subject, translated
 * at render time. Returns the updated student, or null if insufficient.
 */
export function chargeWallet(amount: number, subject: string): Student | null {
  const s = read();
  if (s.balance < amount) return null;
  s.balance -= amount;
  s.wallet = [
    {
      id: uid(),
      type: "purchase",
      amount,
      subject,
      date: new Date().toISOString(),
    },
    ...s.wallet,
  ];
  return write(s);
}

export function toggleFollow(mentorId: number): Student {
  const s = read();
  s.followedMentorIds = s.followedMentorIds.includes(mentorId)
    ? s.followedMentorIds.filter((id) => id !== mentorId)
    : [...s.followedMentorIds, mentorId];
  return write(s);
}

export function isFavorite(courseId: number): boolean {
  return read().favoriteCourseIds.includes(courseId);
}

export function toggleFavorite(courseId: number): Student {
  const s = read();
  s.favoriteCourseIds = s.favoriteCourseIds.includes(courseId)
    ? s.favoriteCourseIds.filter((id) => id !== courseId)
    : [...s.favoriteCourseIds, courseId];
  return write(s);
}
