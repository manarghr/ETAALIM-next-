import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "E-Taalim - About Us",
};

export default function AboutPage() {
  return <AboutContent />;
}
