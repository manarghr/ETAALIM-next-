"use client";

import {createClient} from "@/lib/supabase/client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { login } from "@/lib/auth";
import { isEmailTaken } from "@/lib/signupErrors";
import { setIdentity } from "@/lib/student";
import { tr } from "@/data/localized";
import { CYCLES, YEARS, streamsForYear, Cycle } from "@/data/education";
import styles from "./AuthForm.module.css";

// Turn "yasmine.cherif" → "Yasmine Cherif" for the display name on login.
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "Student";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  // inline login error message (wrong password, etc.) shown under the field
  const [loginError, setLoginError] = useState<string | null>(null);
  // form-level problem shown as a red banner above the form (email already
  // registered, a Google sign-in that came back with an error).
  const [formError, setFormError] = useState<string | null>(null);
  // green banner after a successful password reset
  const [resetDone, setResetDone] = useState(false);

  // /auth/callback sends failed Google sign-ins back here with ?authError=…
  // (cancelled, or the address already belongs to a password account). Reading
  // the query string is exactly the "external system" an effect is for.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("authError");
    // …and /reset-password sends people here with ?reset=1 once the new
    // password is saved, so they can try it out straight away.
    const justReset = params.get("reset") === "1";
    if (!reason && !justReset) return;
    if (reason) {
      setFormError(
        reason === "email_taken" ? t("auth.googleEmailTaken") : t("auth.authFailed")
      );
    }
    if (justReset) setResetDone(true);
    // Drop the query string so a reload doesn't keep showing the banner.
    window.history.replaceState({}, "", window.location.pathname);
  }, [t]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Controlled fields that drive the cascading education section + minor check.
  const [age, setAge] = useState("");
  const [cycle, setCycle] = useState<Cycle | "">("");
  const [year, setYear] = useState("");

  const toggle = (id: string) => setShow((s) => ({ ...s, [id]: !s[id] }));

  const groupClass = (field: string) =>
    `${styles.formGroup} ${errors[field] ? styles.formGroupError : ""}`;

  const ageNum = parseInt(age, 10);
  const isMinorAge = Number.isFinite(ageNum) && ageNum < 18;

  // Reset the dependent selects when the cycle changes.
  const onCycleChange = (value: string) => {
    setCycle(value as Cycle | "");
    setYear("");
  };

  
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Record<string, boolean> = {};

    ["name", "email", "phone", "password"].forEach((f) => {
      if (!String(data.get(f) ?? "").trim()) next[f] = true;
    });

    // Age: required, a sensible whole number.
    if (!Number.isFinite(ageNum) || ageNum < 3 || ageNum > 100) next.age = true;
    // Minors must give a parent's email AND phone number.
    if (isMinorAge && !String(data.get("parentEmail") ?? "").trim())
      next.parentEmail = true;
    if (isMinorAge && !String(data.get("parentPhone") ?? "").trim())
      next.parentPhone = true;

    // Education: cycle + year always; stream for high school; major for uni.
    if (!cycle) next.cycle = true;
    if (cycle && !year) next.year = true;
    if (cycle === "high" && !String(data.get("stream") ?? "").trim())
      next.stream = true;
    if (cycle === "university" && !String(data.get("uniMajor") ?? "").trim())
      next.uniMajor = true;

    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");
    if (password !== confirm) next.confirmPassword = true;
    if (!data.get("terms")) next.terms = true;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    // `extra` = high-school stream OR typed university major; "" otherwise.
    const extra =
      cycle === "high"
        ? String(data.get("stream") ?? "").trim()
        : cycle === "university"
        ? String(data.get("uniMajor") ?? "").trim()
        : "";

    // Mock sign-up: start a session, persist the profile, go to the dashboard.
    const phone = String(data.get("phone") ?? "").trim();
    const parentEmail = isMinorAge
      ? String(data.get("parentEmail") ?? "").trim()
      : "";
    const parentPhone = isMinorAge
      ? String(data.get("parentPhone") ?? "").trim()
      : "";


    // ===== real Supabase sign-up =====
    setFormError(null);
    const supabase = createClient();

    // Create the auth user, carrying the full profile as metadata. A DB trigger
    // (handle_new_user) turns that metadata into the profiles row — so it works
    // even when email confirmation is on and there's no session yet.
    const { data: auth, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name,
          phone,
          role: "student",
          age: ageNum,
          parent_email: parentEmail || null,
          parent_phone: parentPhone || null,
          cycle,
          year,
          stream: extra || null,
        },
      },
    });
    // One account per email address: refuse a second sign-up on an address that
    // already has one (whether it was created with a password or with Google)
    // and point them at the login page instead.
    if (isEmailTaken(signUpError, auth.user)) {
      setErrors({ email: true });
      setFormError(t("auth.emailTaken"));
      return;
    }
    if (signUpError || !auth.user) {
      setFormError(signUpError?.message ?? "Sign-up failed");
      return;
    }

    // Email confirmation on → no session yet: ask them to check their inbox.
    if (!auth.session) {
      setSuccess(true);
      return;
    }

    // Confirmation off → straight into the dashboard.
    router.push("/dashboard");
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null); // clear any previous error
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const supabase = createClient();

    // 1. Check the password and start a session (Supabase does the hashing).
    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !auth.user) {
      // They signed up, but never clicked the confirmation link.
      if (error?.code === "email_not_confirmed") {
        setFormError(t("auth.notConfirmed"));
        return;
      }
      // Otherwise: wrong password — OR an account that only has Google as an
      // identity (it has no password to check). We can't tell the two apart
      // from the browser without leaking which emails are registered, so the
      // message covers both.
      setLoginError(t("auth.invalidLogin"));
      setFormError(t("auth.googleHint"));
      return;
    }

    // 2. Read this user's profile to learn their name + role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role, cycle, year")
      .eq("id", auth.user.id)
      .single();

    const name = profile?.name ?? nameFromEmail(email);
    const role = profile?.role === "mentor" ? "mentor" : "student";

    // 3. TEMPORARY: keep the old localStorage session so the current UI works.
    login({ name, email, role });
    setIdentity(name, email);

    // 4. Route by role — but a student whose profile was created by Google
    //    (no cycle/year yet) finishes signing up first.
    if (role === "student" && (!profile?.cycle || !profile?.year)) {
      router.push("/welcome");
      return;
    }
    router.push(role === "mentor" ? "/mentor-dashboard" : "/dashboard");
  };

  // Sign in with Google (OAuth). Redirects to Google, then back to /auth/callback.
  const handleGoogle = async () => {
    setLoginError(null);
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Always show the "choose an account" screen instead of auto-signing in.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setLoginError(error.message);
  };

  const isRegister = mode === "register";

  return (
    <div className={styles.authPage}>
      <div className="container">
        <div className={styles.authGrid}>
          {/* Illustration — different image per mode */}
          <div className={styles.illustration}>
            <img
              src={isRegister ? "/images/auth-register.svg" : "/images/auth-login.svg"}
              alt=""
            />
          </div>

          {/* Auth card */}
          <div className={styles.card}>
            <div className={styles.head}>
              <h1>{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}</h1>
              <p>{isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}</p>
            </div>

            {success && (
              <div className={styles.success}>
                <i className="fa fa-envelope-o"></i>
                {t("auth.checkEmail")}
              </div>
            )}

            {resetDone && (
              <div className={styles.success}>
                <i className="fa fa-check-circle"></i>
                {t("reset.done")}
              </div>
            )}

            {formError && (
              <div className={styles.alert}>
                <i className="fa fa-exclamation-circle"></i>
                <span>
                  {formError}{" "}
                  {isRegister && (
                    <Link href="/login">{t("auth.switchLogin")}</Link>
                  )}
                </span>
              </div>
            )}

            {/* Login form */}
            {!isRegister && (
              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                  <label htmlFor="login-email">{t("auth.emailLabel")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-envelope"></i>
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      placeholder={t("auth.emailPh")}
                      required
                    />
                  </div>
                </div>

                <div
                  className={`${styles.formGroup} ${loginError ? styles.formGroupError : ""}`}
                >
                  <label htmlFor="login-password">{t("auth.passwordLabel")}</label>
                  <div className={`${styles.inputWithIcon} ${styles.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      type={show.login ? "text" : "password"}
                      id="login-password"
                      name="password"
                      placeholder={t("auth.passwordPh")}
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => toggle("login")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.login ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  {loginError && (
                    <div className={styles.errorMessage}>{loginError}</div>
                  )}
                </div>

                <div className={styles.formOptions}>
                  <label className={styles.rememberMe}>
                    <input type="checkbox" /> {t("auth.rememberMe")}
                  </label>
                  <Link href="/forgot-password" className={styles.forgot}>
                    {t("auth.forgot")}
                  </Link>
                </div>

                <button type="submit" className={styles.submitBtn}>
                  {t("auth.loginBtn")}
                </button>
              </form>
            )}

            {/* Register form */}
            {isRegister && (
              <form className={styles.form} onSubmit={handleRegister} noValidate>
                <div className={groupClass("name")}>
                  <label htmlFor="reg-name">{t("auth.fullName")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-user"></i>
                    <input type="text" id="reg-name" name="name" placeholder={t("auth.fullNamePh")} />
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errName")}</div>
                </div>

                <div className={groupClass("email")}>
                  <label htmlFor="reg-email">{t("auth.emailLabel")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-envelope"></i>
                    <input type="email" id="reg-email" name="email" placeholder={t("auth.emailPh")} />
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errEmail")}</div>
                </div>

                <div className={groupClass("phone")}>
                  <label htmlFor="reg-phone">{t("auth.phone")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-phone"></i>
                    <input type="tel" id="reg-phone" name="phone" placeholder={t("auth.phonePh")} />
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errPhone")}</div>
                </div>

                <div className={groupClass("age")}>
                  <label htmlFor="reg-age">{t("auth.age")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-birthday-cake"></i>
                    <input
                      type="number"
                      id="reg-age"
                      name="age"
                      min={3}
                      max={100}
                      placeholder={t("auth.agePh")}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errAge")}</div>
                </div>

                {/* Minors need a parent's email + phone for purchase approvals. */}
                {isMinorAge && (
                  <>
                    <div className={groupClass("parentEmail")}>
                      <label htmlFor="reg-parent">{t("auth.parentEmail")}</label>
                      <div className={styles.inputWithIcon}>
                        <i className="fa fa-shield"></i>
                        <input
                          type="email"
                          id="reg-parent"
                          name="parentEmail"
                          placeholder={t("auth.parentEmailPh")}
                        />
                      </div>
                      <p className={styles.fieldHint}>{t("auth.parentEmailHint")}</p>
                      <div className={styles.errorMessage}>
                        {t("auth.errParentEmail")}
                      </div>
                    </div>

                    <div className={groupClass("parentPhone")}>
                      <label htmlFor="reg-parent-phone">{t("auth.parentPhone")}</label>
                      <div className={styles.inputWithIcon}>
                        <i className="fa fa-phone"></i>
                        <input
                          type="tel"
                          id="reg-parent-phone"
                          name="parentPhone"
                          placeholder={t("auth.parentPhonePh")}
                        />
                      </div>
                      <div className={styles.errorMessage}>
                        {t("auth.errParentPhone")}
                      </div>
                    </div>
                  </>
                )}

                <div className={groupClass("cycle")}>
                  <label htmlFor="reg-cycle">{t("auth.cycle")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-graduation-cap"></i>
                    <select
                      id="reg-cycle"
                      name="cycle"
                      value={cycle}
                      onChange={(e) => onCycleChange(e.target.value)}
                    >
                      <option value="" disabled>
                        {t("auth.cycleSelect")}
                      </option>
                      {CYCLES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {t(c.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errCycle")}</div>
                </div>

                {/* Year — depends on the chosen cycle */}
                {cycle && (
                  <div className={groupClass("year")}>
                    <label htmlFor="reg-year">{t("auth.yearLabel")}</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fa fa-calendar"></i>
                      <select
                        id="reg-year"
                        name="year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      >
                        <option value="" disabled>
                          {t("auth.yearSelect")}
                        </option>
                        {YEARS[cycle].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.errorMessage}>{t("auth.errYear")}</div>
                  </div>
                )}

                {/* High school — stream, filtered by the chosen year */}
                {cycle === "high" && year && (
                  <div className={groupClass("stream")}>
                    <label htmlFor="reg-stream">{t("auth.stream")}</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fa fa-flask"></i>
                      <select id="reg-stream" name="stream" defaultValue="">
                        <option value="" disabled>
                          {t("auth.streamSelect")}
                        </option>
                        {streamsForYear(year).map((s) => (
                          <option key={s} value={s}>
                            {tr(s, locale)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.errorMessage}>{t("auth.errStream")}</div>
                  </div>
                )}

                {/* University — typed major */}
                {cycle === "university" && (
                  <div className={groupClass("uniMajor")}>
                    <label htmlFor="reg-unimajor">{t("auth.uniMajorLabel")}</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fa fa-book"></i>
                      <input
                        type="text"
                        id="reg-unimajor"
                        name="uniMajor"
                        placeholder={t("auth.uniMajorPh")}
                      />
                    </div>
                    <div className={styles.errorMessage}>{t("auth.errUniMajor")}</div>
                  </div>
                )}

                <div className={groupClass("password")}>
                  <label htmlFor="reg-password">{t("auth.passwordLabel")}</label>
                  <div className={`${styles.inputWithIcon} ${styles.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      type={show.reg ? "text" : "password"}
                      id="reg-password"
                      name="password"
                      placeholder={t("auth.createPasswordPh")}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => toggle("reg")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.reg ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errPassword")}</div>
                </div>

                <div className={groupClass("confirmPassword")}>
                  <label htmlFor="reg-confirm">{t("auth.confirmPassword")}</label>
                  <div className={`${styles.inputWithIcon} ${styles.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      type={show.confirm ? "text" : "password"}
                      id="reg-confirm"
                      name="confirmPassword"
                      placeholder={t("auth.confirmPh")}
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => toggle("confirm")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.confirm ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errConfirm")}</div>
                </div>

                <div className={`${groupClass("terms")} ${styles.termsGroup}`}>
                  <label className={styles.checkboxContainer}>
                    <input type="checkbox" name="terms" />
                    {t("auth.agreePre")}{" "}
                    <a href="#" className={styles.termsLink}>
                      {t("auth.terms")}
                    </a>{" "}
                    {t("auth.and")}{" "}
                    <a href="#" className={styles.termsLink}>
                      {t("auth.privacy")}
                    </a>
                  </label>
                  <div className={styles.errorMessage}>{t("auth.errTerms")}</div>
                </div>

                <button type="submit" className={styles.submitBtn}>
                  {t("auth.createAccount")}
                </button>
              </form>
            )}

            {/* Divider + social login */}
            <div className={styles.divider}>
              <span>{t("auth.orContinue")}</span>
            </div>
            <button type="button" className={styles.googleBtn} onClick={handleGoogle}>
              <i className="fa fa-google"></i> {t("auth.google")}
            </button>

            {/* Switch to the other page */}
            <p className={styles.switch}>
              {isRegister ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
              <Link href={isRegister ? "/login" : "/signup"}>
                {isRegister ? t("auth.switchLogin") : t("auth.switchRegister")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
