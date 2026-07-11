import type { Metadata } from "next";
import MentorsClient from "./MentorsClient";

export const metadata: Metadata = {
  title: "E-Taalim - Mentors",
};

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <MentorsClient sp={sp} />;
}
