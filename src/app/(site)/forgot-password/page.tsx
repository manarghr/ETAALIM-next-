import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "E-Taalim - Forgot password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
