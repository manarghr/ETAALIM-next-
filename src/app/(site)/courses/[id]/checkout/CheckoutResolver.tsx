"use client";

// Checkout for admin-created courses — they only exist client-side, so the
// server page can't resolve them. Mirrors CourseResolver.
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJoinOption, JoinMode } from "@/data/courses";
import { effectiveCourse, EffectiveCourse } from "@/lib/catalog";
import PageLoader from "@/components/PageLoader";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutResolver({ id, mode }: { id: number; mode: JoinMode }) {
  const router = useRouter();
  const [course, setCourse] = useState<EffectiveCourse | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    effectiveCourse(id).then((c) => setCourse(c ?? null));
  }, [id]);

  useEffect(() => {
    if (course === null) router.replace("/courses");
  }, [course, router]);

  if (!course) return <PageLoader />;
  return <CheckoutClient course={course} option={getJoinOption(course, mode)} />;
}
