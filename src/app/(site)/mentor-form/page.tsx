import type { Metadata } from "next";
import MentorForm from "@/components/MentorForm";

export const metadata: Metadata = {
  title: "E-Taalim - Become a Mentor",
};

export default function MentorFormPage() {
  return <MentorForm />;
}
