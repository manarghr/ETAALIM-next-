import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { mentors } from "@/data/mentors";
import { siteUrl } from "@/lib/siteUrl";

// Generates /sitemap.xml so search engines find every public page, including
// the ones that only exist in the database (courses). Private pages are left
// out on purpose — see robots.ts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages = [
    "",
    "/courses",
    "/mentors",
    "/about",
    "/contact",
    "/login",
    "/signup",
    "/mentor-form",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  // Course pages come from the catalog. A plain anon client (no cookies) is
  // enough: courses are public, and RLS returns exactly what a visitor sees.
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data } = await supabase.from("courses").select("id");
      coursePages = (data ?? []).map((c) => ({
        url: `${siteUrl}/courses/${c.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // A sitemap is never worth failing a build over — ship the static half.
  }

  const mentorPages = mentors.map((m) => ({
    url: `${siteUrl}/mentors/${m.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...coursePages, ...mentorPages];
}
