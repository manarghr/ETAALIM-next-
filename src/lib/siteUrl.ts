// The site's own public address, resolved once for metadata, robots and the
// sitemap. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://etaalim.dz);
// Vercel fills VERCEL_URL in on preview deployments, and local dev falls back
// to localhost. Everything that builds an absolute URL should read this — a
// hardcoded domain is what makes staging emails link to production.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
).replace(/\/$/, "");
