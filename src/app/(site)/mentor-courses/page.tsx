import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import MentorCoursesClient from "./MentorCoursesClient";

export const metadata: Metadata = {
  title: "E-Taalim - My Courses",
};

export default function MentorCoursesPage() {
  return (
    <>
      <PageHero
        eyebrowKey="pageHero.myEyebrow"
        titleKey="pageHero.myTitle"
        accentKey="pageHero.myAccent"
        subtitleKey="pageHero.mySubtitle"
        crumbKey="pageHero.myCrumb"
      />
      <MentorCoursesClient />
    </>
  );
}
