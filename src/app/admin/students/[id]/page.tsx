import type { Metadata } from "next";
import { students } from "@/data/students";
import AdminPreviewBar from "../../AdminPreviewBar";
import StudentProfileClient from "./StudentProfileClient";
import StudentResolver from "./StudentResolver";

// Admin view of a student's profile — a simple, dashboard-style page
// (mirrors the student dashboard look) without the site navbar/footer.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const student = students.find((s) => s.id === id);
  return { title: `E-Taalim - Admin · ${student?.name ?? "Student"}` };
}

export default async function AdminStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = students.find((s) => s.id === id);

  return (
    <>
      <AdminPreviewBar />
      {student ? (
        <StudentProfileClient student={student} />
      ) : (
        // Registered accounts live client-side — resolve there.
        <StudentResolver id={id} />
      )}
    </>
  );
}
