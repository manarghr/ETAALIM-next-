import type { Metadata } from "next";
import { getCourseById } from "@/data/courses";
import CourseDetailClient from "./CourseDetailClient";
import CourseResolver from "./CourseResolver";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseById(parseInt(id, 10));
  return { title: `E-Taalim - ${course?.subject ?? "Course"}` };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id, 10);
  const course = getCourseById(courseId);

  // Not in the static catalog → possibly an admin-created course, which only
  // exists client-side; resolve it there (redirects to /courses if unknown).
  if (!course) {
    return <CourseResolver id={courseId} />;
  }

  return <CourseDetailClient course={course} />;
}
