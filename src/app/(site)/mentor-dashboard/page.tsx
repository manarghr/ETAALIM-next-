import type { Metadata } from "next";
import MentorDashboardClient from "./MentorDashboardClient";

export const metadata: Metadata = {
  title: "E-Taalim - Mentor Dashboard",
};

export default function MentorDashboardPage() {
  return <MentorDashboardClient />;
}
