import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCourseById } from "@/data/courses";
import CourseDetailClient from "@/app/(site)/courses/[id]/CourseDetailClient";
import AdminPreviewBar from "../../AdminPreviewBar";

// Admin preview of a course's public page — same content students see,
// but outside the (site) layout so there's no navbar/footer.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseById(parseInt(id, 10));
  return { title: `E-Taalim - Admin · ${course?.subject ?? "Course"}` };
}

export default async function AdminCoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourseById(parseInt(id, 10));

  if (!course) {
    redirect("/admin");
  }

  return (
    <>
      <AdminPreviewBar />
      <CourseDetailClient course={course} />
    </>
  );
}
