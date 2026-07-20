// Admin access gate. DEMO ONLY: the passphrase is checked client-side, which is
// NOT real security — anyone can read it in the bundle. In production, admin is
// a server-enforced role (Supabase RLS), and this file goes away. The unlock
// lives in sessionStorage so a new tab re-asks and closing the browser locks it.
export const ADMIN_PASSWORD = "etaalim-admin";

const KEY = "etaalim.admin";

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Returns true if the passphrase is correct (and unlocks the session). */
export function unlockAdmin(password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
  return true;
}

export function lockAdmin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
