"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mentor } from "@/data/mentors";
import { getRegisteredMentor } from "@/lib/registeredMentors";
import MentorProfileClient from "./MentorProfileClient";

// Resolves a registered (non-seed) mentor by their numeric public_id, then
// renders the same profile UI as seed mentors. Redirects home if not found.
export default function RegisteredMentorProfile({
  publicId,
}: {
  publicId: number;
}) {
  const router = useRouter();
  const [mentor, setMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    getRegisteredMentor(publicId).then((m) => {
      if (m) setMentor(m);
      else router.replace("/mentors");
    });
  }, [publicId, router]);

  if (!mentor) return null;
  return <MentorProfileClient mentor={mentor} />;
}
