// Admin access. The admin is a real Supabase user whose `profiles.role` is
// 'admin' — the same fact the database's `is_admin()` function checks in every
// RLS policy. So the UI gate and the data now agree: signing in here is the
// same act that unlocks the rows, and there is nothing to bypass. (This used to
// be a passphrase compared in the browser, which shipped the password to every
// visitor inside the bundle.)
import { createClient } from "@/lib/supabase/client";

/** Is the person currently signed in an admin? */
export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin";
}

/** Sign in and admit only admins. Returns true on success. A non-admin who
 *  types valid credentials is signed straight back out — the admin area must
 *  not become a second way to log into a normal account. */
export async function signInAsAdmin(
  email: string,
  password: string
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

/** Leave the admin area — a real sign-out, not just a UI flag. */
export async function signOutAdmin(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
