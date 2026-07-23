import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMentorById } from "@/data/mentors";
import MentorProfileClient from "@/app/(site)/mentors/[id]/MentorProfileClient";
import AdminPreviewBar from "../../AdminPreviewBar";

// Admin preview of a mentor's public profile — same content students see,
// but outside the (site) layout so there's no navbar/footer.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mentor = getMentorById(parseInt(id, 10));
  return { title: `E-Taalim - Admin · ${mentor?.name ?? "Mentor"}` };
}

export default async function AdminMentorPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mentor = getMentorById(parseInt(id, 10));

  if (!mentor) {
    redirect("/admin");
  }

  return (
    <>
      <AdminPreviewBar />
      <MentorProfileClient mentor={mentor} />
    </>
  );
}
