import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "E-Taalim - Contact Us",
};

export default function ContactPage() {
  return <ContactContent />;
}
