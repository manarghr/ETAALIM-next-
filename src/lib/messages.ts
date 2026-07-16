// Lightweight student↔mentor messaging, mocked with localStorage. The mentor
// sends a canned auto-reply so a thread feels alive in the demo.
export interface Message {
  id: string;
  from: "student" | "mentor";
  text: string;
  date: string; // ISO
}

const KEY = "etaalim.messages";

type Threads = Record<number, Message[]>;

function readAll(): Threads {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Threads) : {};
  } catch {
    return {};
  }
}

function writeAll(t: Threads): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getThread(mentorId: number): Message[] {
  return readAll()[mentorId] ?? [];
}

export function sendMessage(mentorId: number, text: string): Message[] {
  const all = readAll();
  const now = Date.now();
  const thread = all[mentorId] ?? [];
  thread.push({ id: uid(), from: "student", text, date: new Date(now).toISOString() });
  // canned mentor acknowledgement so the thread isn't one-sided in the demo
  thread.push({
    id: uid(),
    from: "mentor",
    text: "Thanks for reaching out! I'll get back to you shortly. 👍",
    date: new Date(now + 1000).toISOString(),
  });
  all[mentorId] = thread;
  writeAll(all);
  return thread;
}
