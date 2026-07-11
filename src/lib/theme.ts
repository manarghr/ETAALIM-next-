import type { CSSProperties } from "react";

export interface Accent {
  color: string;
  soft: string;
}

// Single, restrained accent (purple) on neutral tints — keeps the UI clean.
const ACCENT: Accent = { color: "#534ab7", soft: "rgba(28, 29, 31, 0.05)" };

export const accents: Accent[] = [ACCENT];

// Stat numbers in near-black, on the light stats band.
export const brightAccents = ["#1c1d1f", "#1c1d1f", "#1c1d1f", "#1c1d1f"];

export function categoryAccent(_major: string): Accent {
  return ACCENT;
}

export function accentByIndex(_i: number): Accent {
  return ACCENT;
}

// Exposes an accent as CSS custom properties (--c / --c-soft) for styling.
export function cssVars(a: Accent): CSSProperties {
  return { "--c": a.color, "--c-soft": a.soft } as CSSProperties;
}

export function colorVar(color: string): CSSProperties {
  return { "--c": color } as CSSProperties;
}
