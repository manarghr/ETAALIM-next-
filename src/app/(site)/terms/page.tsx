import type { Metadata } from "next";
import LegalPage from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "E-Taalim - Terms of Service",
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
