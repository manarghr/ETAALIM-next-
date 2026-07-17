import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCourseById, getJoinOption, JoinMode } from "@/data/courses";
import CheckoutClient from "./CheckoutClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = getCourseById(parseInt(id, 10));
  return { title: `E-Taalim - Checkout · ${course?.subject ?? ""}` };
}

const VALID_MODES: JoinMode[] = ["recorded", "group", "individual"];

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const course = getCourseById(parseInt(id, 10));
  if (!course) redirect("/courses");

  const modeParam = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode;
  const mode: JoinMode = VALID_MODES.includes(modeParam as JoinMode)
    ? (modeParam as JoinMode)
    : "recorded";
  const option = getJoinOption(course, mode);

  // The teacher's display name is derived client-side, where the active
  // locale decides how the name is rendered.
  return <CheckoutClient course={course} option={option} />;
}
