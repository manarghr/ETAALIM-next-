import type { Metadata } from "next";
import { getMentorById } from "@/data/mentors";
import MentorProfileClient from "./MentorProfileClient";
import RegisteredMentorProfile from "./RegisteredMentorProfile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mentor = getMentorById(parseInt(id, 10));
  return { title: `E-Taalim - ${mentor?.name ?? "Mentor"}` };
}

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mentor = getMentorById(parseInt(id, 10));

  // Seed mentor → render directly; otherwise resolve a registered mentor.
  if (mentor) return <MentorProfileClient mentor={mentor} />;
  return <RegisteredMentorProfile publicId={parseInt(id, 10)} />;
}
