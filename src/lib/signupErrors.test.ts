import { describe, it, expect } from "vitest";
import { isEmailTaken } from "./signupErrors";
import type { AuthError, User } from "@supabase/supabase-js";

// Just enough of a Supabase user to exercise the check.
const user = (identities: unknown[] | undefined) =>
  ({ id: "u1", identities } as unknown as User);

const authError = (message: string, code?: string) =>
  ({ message, code } as unknown as AuthError);

describe("isEmailTaken", () => {
  // Confirmation OFF: Supabase says so outright.
  it("spots the explicit 'already registered' error", () => {
    expect(isEmailTaken(authError("User already registered"), null)).toBe(true);
  });

  it("matches the error code as well as the message", () => {
    expect(isEmailTaken(authError("whatever", "user_already_exists"), null)).toBe(
      true
    );
  });

  // Confirmation ON: no error at all — an empty identities array is the only
  // signal, because Supabase hides which addresses exist.
  it("spots the decoy user with no identities", () => {
    expect(isEmailTaken(null, user([]))).toBe(true);
  });

  it("treats a real new signup as available", () => {
    expect(isEmailTaken(null, user([{ provider: "email" }]))).toBe(false);
  });

  it("does not mistake an unrelated error for a taken email", () => {
    expect(isEmailTaken(authError("Password is too short"), null)).toBe(false);
  });

  it("does not call a missing identities field 'taken'", () => {
    // Absence tells us nothing. Guessing "taken" here would refuse a genuine
    // new sign-up, which is the worse of the two mistakes.
    expect(isEmailTaken(null, user(undefined))).toBe(false);
  });
});
