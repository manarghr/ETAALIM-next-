import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "E-Taalim - My Dashboard",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
