import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCourseById } from "@/data/courses";
import CourseDetailClient from "./CourseDetailClient";

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
  const course = getCourseById(parseInt(id, 10));

  if (!course) {
    redirect("/courses");
  }

  return <CourseDetailClient course={course} />;
}
