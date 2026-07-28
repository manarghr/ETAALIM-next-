import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Everything that finishes authenticating somewhere else comes back here:
//   • Google (OAuth) — with a one-time `code`,
//   • the email-confirmation link — also with a `code`,
//   • the password-reset link — a `code` plus `next=/reset-password`.
// We swap that code for a real session, then send the person to the right place.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("error_code");
  // Only ever an in-app path — never an absolute URL, or this would be an
  // open redirect anyone could point at their own site.
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") ? nextParam : null;

  // A flow that named its own destination (password recovery) should fail
  // *there*, with its own wording — not on /login as a sign-in problem.
  const backToLogin = (reason: string) =>
    NextResponse.redirect(
      next ? `${origin}${next}?error=${reason}` : `${origin}/login?authError=${reason}`
    );

  // Supabase/Google can bounce us back WITHOUT a code: the user cancelled, or
  // the Google address already belongs to a different account and automatic
  // identity linking refused to merge them.
  if (oauthError) {
    const taken =
      oauthErrorCode === "identity_already_exists" ||
      oauthErrorCode === "email_exists" ||
      (searchParams.get("error_description") ?? "").toLowerCase().includes("already");
    return backToLogin(taken ? "email_taken" : "failed");
  }
  if (!code) return backToLogin("failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return backToLogin("failed");

  // A password reset asked for a specific destination; role routing doesn't
  // apply until they've actually chosen the new password.
  if (next) return NextResponse.redirect(`${origin}${next}`);

  // The `handle_new_user` trigger created the profile row the moment the auth
  // user was created — including for Google users, who arrive with only a name
  // and an avatar. So a missing cycle/year means "signed in with Google and
  // hasn't finished signing up yet", not "something went wrong".
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, cycle, year")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role === "mentor") {
    return NextResponse.redirect(`${origin}/mentor-dashboard`);
  }
  if (!profile || !profile.cycle || !profile.year) {
    return NextResponse.redirect(`${origin}/welcome`);
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
