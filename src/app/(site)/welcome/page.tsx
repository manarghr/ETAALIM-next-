import type { Metadata } from "next";
import WelcomeClient from "./WelcomeClient";

export const metadata: Metadata = {
  title: "E-Taalim - Finish signing up",
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
