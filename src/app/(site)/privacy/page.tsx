import type { Metadata } from "next";
import LegalPage from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "E-Taalim - Privacy Policy",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
