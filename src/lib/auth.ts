// Mock session (localStorage). Login/signup set it; the header and dashboard
// react to it. Swap the internals for real auth later — callers stay the same.
export type Role = "student" | "mentor";

export interface Session {
  name: string;
  email: string;
  role: Role;
}

const KEY = "etaalim.session";
export const AUTH_EVENT = "etaalim-auth";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function login(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}
