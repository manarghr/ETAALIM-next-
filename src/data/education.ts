// The Algerian education system, modelled for the signup form + dashboard.
//
// Cycles: Primary (5y) → Middle/CEM (4y) → Secondary/Lycée (3y) → University.
// Year codes (1AP, 3AM, 3AS, …) are standard Algerian abbreviations used
// verbatim in every language, so we don't translate them. Stream names ARE
// translated (via the localized.ts dictionary).

import type { Locale } from "@/i18n/translations";
import { tr } from "./localized";

export type Cycle = "primary" | "middle" | "high" | "university";

export const CYCLES: { id: Cycle; labelKey: string }[] = [
  { id: "primary", labelKey: "auth.cyclePrimary" },
  { id: "middle", labelKey: "auth.cycleMiddle" },
  { id: "high", labelKey: "auth.cycleHigh" },
  { id: "university", labelKey: "auth.cycleUniversity" },
];

// Année Primaire / Moyenne / Secondaire; Licence / Master / Doctorat.
export const YEARS: Record<Cycle, string[]> = {
  primary: ["1AP", "2AP", "3AP", "4AP", "5AP"],
  middle: ["1AM", "2AM", "3AM", "4AM"],
  high: ["1AS", "2AS", "3AS"],
  university: ["L1", "L2", "L3", "M1", "M2", "Doctorat"],
};

// 1AS is a common core; specialisation into streams happens in 2AS/3AS.
const COMMON_CORE = ["Common Core Science", "Common Core Arts"];
const HIGH_STREAMS = [
  "Experimental Sciences",
  "Mathematics",
  "Technical Mathematics",
  "Management & Economics",
  "Literature & Philosophy",
  "Foreign Languages",
];

/** Streams available for a given high-school year. */
export function streamsForYear(year: string): string[] {
  return year === "1AS" ? COMMON_CORE : HIGH_STREAMS;
}

/** Structured education captured at signup. */
export interface Education {
  cycle: Cycle;
  year: string;
  /** stream (high school, English canonical) or typed major (university); "" otherwise */
  extra: string;
}

/**
 * Localised profile line, e.g. "3AS · Experimental Sciences",
 * "5AP · Primary", "L2 · Computer Science". Year codes stay as-is; the
 * description is translated (except a university major, which is free text).
 */
export function educationLabel(edu: Education, locale: Locale): string {
  let desc: string;
  switch (edu.cycle) {
    case "primary":
      desc = tr("Primary", locale);
      break;
    case "middle":
      desc = tr("Middle", locale);
      break;
    case "high":
      desc = tr(edu.extra || "High School", locale);
      break;
    case "university":
      desc = edu.extra; // typed major — shown as entered
      break;
  }
  return edu.year ? `${edu.year} · ${desc}` : desc;
}
