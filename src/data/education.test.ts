import { describe, it, expect } from "vitest";
import { CYCLES, YEARS, streamsForYear, educationLabel } from "./education";

// The Algerian school system is the backbone of the whole catalog: a student's
// cycle and year decide which courses they're shown, so these shapes breaking
// silently would misfile every student.
describe("the education structure", () => {
  it("has the right number of years in each cycle", () => {
    expect(YEARS.primary).toHaveLength(5); // 1AP–5AP
    expect(YEARS.middle).toHaveLength(4); // 1AM–4AM
    expect(YEARS.high).toHaveLength(3); // 1AS–3AS
  });

  it("offers a year list for every cycle in the picker", () => {
    for (const cycle of CYCLES) {
      expect(YEARS[cycle.id].length).toBeGreaterThan(0);
    }
  });
});

describe("streamsForYear", () => {
  it("gives 1AS the common cores, not the specialised streams", () => {
    // Specialisation only happens from 2AS — a 1AS student picking
    // "Experimental Sciences" would be a year early.
    const streams = streamsForYear("1AS");
    expect(streams).toContain("Common Core Science");
    expect(streams).not.toContain("Experimental Sciences");
  });

  it("gives 2AS and 3AS the full set of streams", () => {
    for (const year of ["2AS", "3AS"]) {
      const streams = streamsForYear(year);
      expect(streams).toContain("Experimental Sciences");
      expect(streams).toContain("Literature & Philosophy");
      expect(streams).toHaveLength(6);
    }
  });
});

describe("educationLabel", () => {
  it("keeps the year code and adds the stream", () => {
    const label = educationLabel(
      { cycle: "high", year: "3AS", extra: "Mathematics" },
      "en"
    );
    expect(label).toContain("3AS");
    expect(label).toContain("Mathematics");
  });

  it("shows a university major exactly as the student typed it", () => {
    // Free text, so it must never be run through the translation dictionary.
    const label = educationLabel(
      { cycle: "university", year: "L2", extra: "Génie Civil" },
      "en"
    );
    expect(label).toContain("Génie Civil");
  });

  it("falls back to the cycle name when there's no stream", () => {
    const label = educationLabel(
      { cycle: "primary", year: "5AP", extra: "" },
      "en"
    );
    expect(label).toContain("5AP");
    expect(label.length).toBeGreaterThan("5AP".length);
  });
});
