import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

// Generates /robots.txt. Crawlers may read the public site; the private areas
// are kept out of search results. (This is politeness, not protection — the
// real gate is proxy.ts + RLS. Never list a secret path here: robots.txt is
// the first file an attacker opens.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/mentor-dashboard",
        "/welcome",
        "/auth/",
        "/api/",
        "/reset-password",
        "/forgot-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
