import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMentorById } from "@/data/mentors";
import MentorProfileClient from "./MentorProfileClient";

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

  if (!mentor) {
    redirect("/mentors");
  }

  return <MentorProfileClient mentor={mentor} />;
}
