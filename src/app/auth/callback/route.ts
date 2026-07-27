import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Everything that finishes authenticating somewhere else comes back here:
//   • Google (OAuth) — with a one-time `code`,
//   • the email-confirmation link — also with a `code`.
// We swap that code for a real session, then send the person to the right place.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("error_code");

  const backToLogin = (reason: string) =>
    NextResponse.redirect(`${origin}/login?authError=${reason}`);

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
