import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Where the browser is allowed to talk to Supabase (REST + Realtime websocket).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabaseUrl.replace(/^https:/, "wss:");

// Content Security Policy — the browser-side rule sheet: which origins may load
// scripts, styles, fonts and images, and which origins the page may connect to.
// Its real job here is to make an injected <script> useless: even if some text
// we render ever slipped through as HTML, the browser refuses to run code from
// an origin that isn't on this list, and refuses to ship data to one either.
//
// `'unsafe-inline'` on script-src is the honest compromise: Next inlines its
// hydration bootstrap, and the nonce alternative forces every page to render
// dynamically (no static caching). Worth revisiting if this ever guards real
// money: generate a nonce in proxy.ts and swap it in here.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Google Fonts + Font Awesome are loaded from CDNs in app/layout.tsx.
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com`,
  `font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com`,
  // Avatars can be any https URL (Google profile pictures); attachments are data:/blob:.
  `img-src 'self' blob: data: https:`,
  `media-src 'self' blob: data:`,
  `connect-src 'self' ${supabaseUrl} ${supabaseWs} https://*.supabase.co wss://*.supabase.co${
    isDev ? " ws://localhost:* http://localhost:*" : ""
  }`,
  `object-src 'none'`, // no <object>/<embed> script sinks
  `base-uri 'self'`, // an injected <base> can't re-point every relative URL
  `form-action 'self'`, // a form can't be made to POST your input elsewhere
  `frame-ancestors 'none'`, // nobody can iframe us → no clickjacking
  `frame-src 'none'`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Legacy twin of frame-ancestors, for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let the browser guess that a file is HTML/JS when we said it isn't.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Never leak the full URL (which can carry ids or tokens) to another site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Hardware/APIs this site never uses — off, so injected code can't ask for them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HTTPS only, remembered by the browser. Ignored on http://localhost, which
  // is why it's production-only.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Don't advertise the framework to anyone scanning for known holes.
  poweredByHeader: false,
  // The project lives in a subfolder; pin the workspace root to avoid Next
  // picking up an unrelated lockfile higher up the tree.
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
