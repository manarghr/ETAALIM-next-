// Lightweight student↔mentor messaging, mocked with localStorage. The mentor
// sends a canned auto-reply so a thread feels alive in the demo.

/** An image or file a message carries. Stored as a base64 data URL so the
 *  demo works without a backend/upload server. Kept small on purpose. */
export interface Attachment {
  kind: "image" | "file";
  name: string;
  size: number; // bytes
  mime: string;
  dataUrl: string; // base64 data URL
}

export interface Message {
  id: string;
  from: "student" | "mentor";
  text: string; // may be empty when the message is only an attachment
  attachment?: Attachment;
  /** true for the canned mentor reply — rendered via i18n, not stored text */
  auto?: boolean;
  date: string; // ISO
}

/** Largest attachment we'll keep — localStorage is small, so cap hard. */
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB

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
    /* ignore quota / privacy-mode errors */
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getThread(mentorId: number): Message[] {
  return readAll()[mentorId] ?? [];
}

export function sendMessage(
  mentorId: number,
  text: string,
  attachment?: Attachment
): Message[] {
  const all = readAll();
  const now = Date.now();
  const thread = all[mentorId] ?? [];
  thread.push({
    id: uid(),
    from: "student",
    text,
    attachment,
    date: new Date(now).toISOString(),
  });
  // canned mentor acknowledgement so the thread isn't one-sided in the demo.
  // `auto` lets the UI render it in the active language instead of a stored
  // English string.
  thread.push({
    id: uid(),
    from: "mentor",
    text: "",
    auto: true,
    date: new Date(now + 1000).toISOString(),
  });
  all[mentorId] = thread;
  writeAll(all);
  return thread;
}
