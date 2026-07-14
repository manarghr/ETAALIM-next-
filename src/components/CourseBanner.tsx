// Lightweight, per-subject SVG banner used as the background layer of course
// cards (replaces the stock photo). Pure/deterministic — safe to SSR — with a
// `seed` so the same subject scatters differently across cards.
//
// One inline <svg> with a viewBox + preserveAspectRatio="slice" scales cleanly
// from the wide listing card down to the 64px checkout thumbnail.

import { ReactNode } from "react";
import styles from "./CourseBanner.module.css";

// ---- deterministic PRNG (so server & client render identically) ----
function makeRng(seed: number) {
  let s = (Math.abs(seed) * 2654435761 + 12345) % 2147483647;
  if (s <= 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---- line-style icons, drawn in a 0..24 box (stroke = currentColor) ----
const ICONS: Record<string, ReactNode> = {
  atom: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <ellipse cx={12} cy={12} rx={10} ry={4} />
      <ellipse cx={12} cy={12} rx={10} ry={4} transform="rotate(60 12 12)" />
      <ellipse cx={12} cy={12} rx={10} ry={4} transform="rotate(120 12 12)" />
      <circle cx={12} cy={12} r={1.6} fill="currentColor" stroke="none" />
    </g>
  ),
  wave: (
    <path
      d="M1 13 C4 6 7 6 10 13 S16 20 19 13 S24 6 26 13"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  ),
  prism: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round">
      <path d="M12 3 L21 19 L3 19 Z" />
      <path d="M21 11 h3" strokeLinecap="round" />
    </g>
  ),
  flask: (
    <path
      d="M10 3 h4 M10.5 3 v6 l-4.6 8.2 A2 2 0 0 0 7.6 20 h8.8 a2 2 0 0 0 1.7 -2.8 L13.5 9 V3"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  ),
  molecule: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <line x1={7} y1={8} x2={17} y2={7} />
      <line x1={7} y1={9} x2={12} y2={16} />
      <line x1={17} y1={8} x2={12} y2={16} />
      <circle cx={6} cy={8} r={2.4} />
      <circle cx={18} cy={7} r={2.4} />
      <circle cx={12} cy={17} r={2.4} />
    </g>
  ),
  leaf: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round">
      <path d="M5 19 C5 9 12 4 19 5 C20 12 15 20 5 19 Z" />
      <path d="M8 16 C11 12 15 8 18 6" strokeLinecap="round" />
    </g>
  ),
  dna: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
      <path d="M8 3 C16 8 8 16 16 21" />
      <path d="M16 3 C8 8 16 16 8 21" />
      <line x1={9.5} y1={6} x2={14.5} y2={6} />
      <line x1={9.5} y1={18} x2={14.5} y2={18} />
      <line x1={8.2} y1={12} x2={15.8} y2={12} />
    </g>
  ),
  chart: (
    <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4 V20 H21" />
      <path d="M6 16 L11 11 L14 13 L20 6" />
      <path d="M20 6 h-3 M20 6 v3" />
    </g>
  ),
  coin: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <circle cx={12} cy={12} r={8} />
      <circle cx={12} cy={12} r={4.6} />
      <line x1={12} y1={4} x2={12} y2={7.4} strokeLinecap="round" />
      <line x1={12} y1={16.6} x2={12} y2={20} strokeLinecap="round" />
    </g>
  ),
  book: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round">
      <path d="M12 6 C9.5 4 5.5 4 3 5 V19 C5.5 18 9.5 18 12 20 C14.5 18 18.5 18 21 19 V5 C18.5 4 14.5 4 12 6 Z" />
      <path d="M12 6 V20" />
    </g>
  ),
  column: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
      <path d="M4 5 H20 M5 8 H19 M5 19 H19 M4 21 H20" />
      <path d="M8 8 V19 M12 8 V19 M16 8 V19" />
    </g>
  ),
  hourglass: (
    <g fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 H18 M6 21 H18" />
      <path d="M7 3 C7 10 17 10 17 3" />
      <path d="M7 21 C7 14 17 14 17 21" />
    </g>
  ),
};

type Glyph = { icon: string } | { ch: string; serif?: boolean };

const MOTIFS: Record<string, Glyph[]> = {
  arabic: [{ ch: "ا", serif: true }, { ch: "ب", serif: true }, { ch: "ت", serif: true }, { ch: "ث", serif: true }, { ch: "ن", serif: true }, { ch: "م", serif: true }],
  math: [{ ch: "+" }, { ch: "÷" }, { ch: "π" }, { ch: "√" }, { ch: "∑" }, { ch: "×" }],
  physics: [{ icon: "atom" }, { icon: "wave" }, { icon: "prism" }, { ch: "λ" }],
  chemistry: [{ icon: "flask" }, { icon: "molecule" }, { ch: "H₂O", serif: false }],
  biology: [{ icon: "leaf" }, { icon: "dna" }, { icon: "molecule" }],
  cs: [{ ch: "<" }, { ch: "/" }, { ch: ">" }, { ch: "0" }, { ch: "1" }, { ch: "{ }" }],
  economy: [{ icon: "chart" }, { icon: "coin" }, { ch: "%" }, { ch: "€" }],
  english: [{ icon: "book" }, { ch: "A", serif: true }, { ch: "B", serif: true }, { ch: "C", serif: true }],
  french: [{ icon: "book" }, { ch: "é", serif: true }, { ch: "à", serif: true }, { ch: "ê", serif: true }],
  history: [{ icon: "column" }, { icon: "hourglass" }, { icon: "column" }],
};

// map the course's `major` field onto a motif
function motifFor(subject: string): Glyph[] {
  const s = subject.toLowerCase();
  if (s.includes("arab")) return MOTIFS.arabic;
  if (s.includes("math")) return MOTIFS.math;
  if (s.includes("phys")) return MOTIFS.physics;
  if (s.includes("chem")) return MOTIFS.chemistry;
  if (s.includes("bio") || s.includes("natural") || s.includes("science")) return MOTIFS.biology;
  if (s.includes("comput") || s.includes("techno")) return MOTIFS.cs;
  if (s.includes("econ") || s.includes("account") || s.includes("manage")) return MOTIFS.economy;
  if (s.includes("english")) return MOTIFS.english;
  if (s.includes("french") || s.includes("language")) return MOTIFS.french;
  if (s.includes("hist") || s.includes("philo") || s.includes("geog")) return MOTIFS.history;
  return MOTIFS.math;
}

// base scatter positions (viewBox units, 300x180) that dodge the badge corners:
// category pill (top-left), price pill (bottom-right), exam badge (top-right).
// Left-biased scatter — the illustration lives on the right, category pill is
// top-left, so keep symbols to the lower-left band.
const SLOTS = [
  { x: 55, y: 74 },
  { x: 112, y: 106 },
  { x: 40, y: 128 },
  { x: 92, y: 150 },
  { x: 134, y: 66 },
];

export default function CourseBanner({
  subject,
  seed = 1,
  className,
}: {
  subject: string;
  seed?: number;
  className?: string;
}) {
  const rng = makeRng(seed);
  const pool = motifFor(subject);
  const count = 3 + Math.floor(rng() * 2); // 3–4 accent symbols
  const start = Math.floor(rng() * pool.length);

  // Neutral slate does most of the work; purple stays a light accent so the
  // banner doesn't compete with the (purple) category + price pills on top.
  const INK = "#3b4252";

  const items = SLOTS.slice(0, count).map((slot, i) => {
    const g = pool[(start + i) % pool.length];
    const x = slot.x + (rng() - 0.5) * 26;
    const y = slot.y + (rng() - 0.5) * 22;
    const size = 24 + rng() * 12;
    const rot = (rng() - 0.5) * 32;
    const accent = i === 0; // just one violet accent per card
    const opacity = accent ? 0.22 : 0.13 + rng() * 0.05;
    const color = accent ? "var(--primary)" : INK;
    return { g, x, y, size, rot, opacity, color, key: i };
  });

  return (
    <svg
      className={`${styles.banner} ${className ?? ""}`}
      viewBox="0 0 300 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="300" height="180" fill="#f3f4f6" />

      {/* soft colour masses — one faint violet, one neutral */}
      <ellipse cx="252" cy="46" rx="92" ry="70" fill="rgba(83, 74, 183, 0.08)" />
      <ellipse cx="36" cy="152" rx="80" ry="58" fill="rgba(59, 66, 82, 0.05)" />

      {/* shared creativity illustration (recoloured to the site palette) */}
      <image
        href="/images/creativity.svg"
        x="150"
        y="2"
        width="188"
        height="188"
        opacity="0.9"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* scattered subject symbols (left band) */}
      {items.map(({ g, x, y, size, rot, opacity, color, key }) =>
        "ch" in g ? (
          <text
            key={key}
            x={x}
            y={y}
            fontSize={size}
            fontWeight={600}
            fontFamily={g.serif ? 'Georgia, "Times New Roman", serif' : "inherit"}
            opacity={opacity}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fill: color }}
            transform={`rotate(${rot} ${x} ${y})`}
          >
            {g.ch}
          </text>
        ) : (
          <g
            key={key}
            opacity={opacity}
            style={{ color }}
            transform={`translate(${x} ${y}) rotate(${rot}) scale(${size / 24}) translate(-12 -12)`}
          >
            {ICONS[g.icon]}
          </g>
        )
      )}
    </svg>
  );
}
