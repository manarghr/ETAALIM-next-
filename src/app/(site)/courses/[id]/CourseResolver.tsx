"use client";

// Fallback for course ids that aren't in the static catalog — i.e. courses the
// admin created. Their data lives client-side, so the server page can't find
// them; this resolves on mount and renders the normal detail page.
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { effectiveCourse, EffectiveCourse } from "@/lib/catalog";
import PageLoader from "@/components/PageLoader";
import CourseDetailClient from "./CourseDetailClient";

export default function CourseResolver({ id }: { id: number }) {
  const router = useRouter();
  // undefined = still resolving, null = genuinely unknown course
  const [course, setCourse] = useState<EffectiveCourse | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
   effectiveCourse(id).then((c) => setCourse(c ?? null));
  }, [id]);

  useEffect(() => {
    if (course === null) router.replace("/courses");
  }, [course, router]);

  if (!course) return <PageLoader />;
  return <CourseDetailClient course={course} />;
}
