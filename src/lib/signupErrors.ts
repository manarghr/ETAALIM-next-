// Reading Supabase sign-up results: "is this email already taken?"
//
// Supabase reports an already-registered address in TWO different shapes,
// depending on the project's "Confirm email" setting:
//
//   • confirmation OFF → a real error: "User already registered".
//   • confirmation ON  → NO error at all. Supabase deliberately hides whether
//     an address exists (otherwise anyone could probe the site for registered
//     emails). It returns a decoy user object whose `identities` array is
//     EMPTY — that empty array is the only reliable giveaway.
//
// One account per email address is the rule: a second sign-up must be refused,
// and the person told to log in (with their password or with Google) instead.
import type { AuthError, User } from "@supabase/supabase-js";

export function isEmailTaken(
  error: AuthError | null,
  user: User | null
): boolean {
  if (error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("already registered") ||
      message.includes("already exists") ||
      error.code === "user_already_exists" ||
      error.code === "email_exists"
    );
  }
  // Confirmation ON: a decoy user with no identities = the email is taken.
  return Boolean(user && (user.identities?.length ?? 0) === 0);
}
