// Demo student account (profile + wallet + followed mentors), localStorage-backed.
// Swap the read/write internals for API calls when the backend lands; callers
// (the dashboard) stay unchanged.
export interface WalletTx {
  id: string;
  type: "topup" | "purchase";
  amount: number; // DZD, always positive
  label: string;
  date: string; // ISO
}

export interface Student {
  id: number;
  name: string;
  email: string;
  initials: string;
  grade: string;
  age: number;
  parentEmail: string;
  balance: number; // DZD
  followedMentorIds: number[];
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
  wallet: [
    {
      id: "seed-topup",
      type: "topup",
      amount: 6000,
      label: "Wallet top-up · BaridiMob",
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

/** Sync the profile name/email from the logged-in session. */
export function setIdentity(name: string, email: string): Student {
  const s = read();
  if (name) s.name = name;
  if (email) s.email = email;
  s.initials = (s.name || "S")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return write(s);
}

export function isMinor(s: Student): boolean {
  return s.age < 18;
}

export function addFunds(amount: number, label = "Wallet top-up"): Student {
  const s = read();
  s.balance += amount;
  s.wallet = [
    { id: uid(), type: "topup", amount, label, date: new Date().toISOString() },
    ...s.wallet,
  ];
  return write(s);
}

/** Deduct from the wallet. Returns the updated student, or null if insufficient. */
export function chargeWallet(amount: number, label: string): Student | null {
  const s = read();
  if (s.balance < amount) return null;
  s.balance -= amount;
  s.wallet = [
    { id: uid(), type: "purchase", amount, label, date: new Date().toISOString() },
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
