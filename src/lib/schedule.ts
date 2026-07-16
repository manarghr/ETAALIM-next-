// Session scheduling + countdown helpers, and the promo/discount feed.
// Enrolled courses get a deterministic upcoming session time (spread across the
// next minutes → days) so the calendar and "starts in…" notifications are lively
// in the demo. Pass a fixed `base` (captured once on mount) so times are stable
// across re-renders.
const OFFSETS_MIN = [10, 180, 1440, 2880, 7200, 12960, 20160]; // 10m, 3h, 1d, 2d, 5d, 9d, 14d

export function sessionDateFor(index: number, base: number): Date {
  return new Date(base + OFFSETS_MIN[index % OFFSETS_MIN.length] * 60_000);
}

/** "in 10 minutes", "in 3 hours", "tomorrow", "in 5 days". */
export function formatCountdown(target: Date, base: number): string {
  const mins = Math.round((target.getTime() - base) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins} minute${mins === 1 ? "" : "s"}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** true when the session is close enough to warrant a heads-up notification. */
export function isSoon(target: Date, base: number): boolean {
  const days = (target.getTime() - base) / 86_400_000;
  return days <= 10;
}

export interface Discount {
  id: string;
  title: string;
  text: string;
  tag: string; // e.g. "−20%"
  audience: string; // who it targets
  accent: string; // hex accent
}

// Promotional feed shown in Notifications (BEM/BAC + seasonal offers).
export const DISCOUNTS: Discount[] = [
  {
    id: "bac",
    title: "BAC revision pack — 20% off",
    text: "Intensive 3AS revisions by stream. Offer ends this month.",
    tag: "−20%",
    audience: "3AS",
    accent: "#1d9e75",
  },
  {
    id: "bem",
    title: "BEM revision pack — 20% off",
    text: "Targeted 4AM revisions across every core subject.",
    tag: "−20%",
    audience: "4AM",
    accent: "#534ab7",
  },
  {
    id: "backtoschool",
    title: "Back-to-school — 15% off primary & middle",
    text: "Give younger students a head start this September.",
    tag: "−15%",
    audience: "Primary · Middle",
    accent: "#e08a2b",
  },
];
