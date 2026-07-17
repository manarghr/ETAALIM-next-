// Session scheduling + countdown helpers, and the promo/discount feed.
// Enrolled courses get a deterministic upcoming session time (spread across the
// next minutes → days) so the calendar and "starts in…" notifications are lively
// in the demo. Pass a fixed `base` (captured once on mount) so times are stable
// across re-renders.
const OFFSETS_MIN = [10, 180, 1440, 2880, 7200, 12960, 20160]; // 10m, 3h, 1d, 2d, 5d, 9d, 14d

export function sessionDateFor(index: number, base: number): Date {
  return new Date(base + OFFSETS_MIN[index % OFFSETS_MIN.length] * 60_000);
}

/**
 * A countdown as data rather than a finished sentence: the caller renders it
 * through the i18n dictionary ("in 10 minutes" / "خلال 10 دقائق"), so no
 * English leaks out of this module.
 */
export interface Countdown {
  key: string; // translation key under `cd.*`
  n: number; // substituted into {n}; 0 when the phrase has no number
}

export function countdownOf(target: Date, base: number): Countdown {
  const mins = Math.round((target.getTime() - base) / 60_000);
  if (mins < 1) return { key: "cd.now", n: 0 };
  if (mins < 60)
    return { key: mins === 1 ? "cd.minuteOne" : "cd.minuteOther", n: mins };
  const hours = Math.round(mins / 60);
  if (hours < 24)
    return { key: hours === 1 ? "cd.hourOne" : "cd.hourOther", n: hours };
  const days = Math.round(hours / 24);
  if (days === 1) return { key: "cd.tomorrow", n: 1 };
  return { key: "cd.dayOther", n: days };
}

/** true when the session is close enough to warrant a heads-up notification. */
export function isSoon(target: Date, base: number): boolean {
  const days = (target.getTime() - base) / 86_400_000;
  return days <= 10;
}

export interface Discount {
  id: string;
  titleKey: string; // translation keys under `promo.*`
  textKey: string;
  tag: string; // e.g. "−20%" — language-neutral
  audience: string; // who it targets
  accent: string; // hex accent
}

// Promotional feed shown in Notifications (BEM/BAC + seasonal offers).
export const DISCOUNTS: Discount[] = [
  {
    id: "bac",
    titleKey: "promo.bacTitle",
    textKey: "promo.bacText",
    tag: "−20%",
    audience: "3AS",
    accent: "#1d9e75",
  },
  {
    id: "bem",
    titleKey: "promo.bemTitle",
    textKey: "promo.bemText",
    tag: "−20%",
    audience: "4AM",
    accent: "#534ab7",
  },
  {
    id: "backtoschool",
    titleKey: "promo.btsTitle",
    textKey: "promo.btsText",
    tag: "−15%",
    audience: "Primary · Middle",
    accent: "#e08a2b",
  },
];
