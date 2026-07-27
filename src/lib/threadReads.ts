// Per-conversation "last read" timestamps so an unread badge clears once the
// thread is opened. Device-local (localStorage) — read receipts don't need to
// sync across devices, and this avoids a round-trip on every thread open.
const KEY = "etaalim.threadReads";
type Store = Record<string, string>; // threadKey -> ISO timestamp of last read

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

/** ISO timestamp of the newest message the reader has seen ("" if never). */
export function getLastRead(threadKey: string): string {
  return read()[threadKey] ?? "";
}

/**
 * Mark a thread read up to `upToDate` — the timestamp of its newest message.
 * We store the *message's* server timestamp (not the local clock) so unread
 * comparisons are server-time vs server-time and immune to clock skew.
 */
export function markThreadRead(threadKey: string, upToDate: string): void {
  if (typeof window === "undefined" || !upToDate) return;
  const s = read();
  // Never move the marker backwards.
  if ((s[threadKey] ?? "") >= upToDate) return;
  s[threadKey] = upToDate;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
