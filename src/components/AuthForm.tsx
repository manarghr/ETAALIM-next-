"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { login } from "@/lib/auth";
import { setIdentity } from "@/lib/student";
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
  const { t } = useI18n();
  const router = useRouter();
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const toggle = (id: string) => setShow((s) => ({ ...s, [id]: !s[id] }));

  const groupClass = (field: string) =>
    `${styles.formGroup} ${errors[field] ? styles.formGroupError : ""}`;

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Record<string, boolean> = {};

    const required = ["name", "email", "phone", "major", "level", "password"];
    required.forEach((f) => {
      if (!String(data.get(f) ?? "").trim()) next[f] = true;
    });
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");
    if (password !== confirm) next.confirmPassword = true;
    if (!data.get("terms")) next.terms = true;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Mock sign-up: start a session and go to the dashboard (backend later).
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    login({ name, email, role: "student" });
    setIdentity(name, email);
    router.push("/dashboard");
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const name = nameFromEmail(email);
    // Mock login: start a session and go to the dashboard (backend later).
    login({ name, email, role: "student" });
    setIdentity(name, email);
    router.push("/dashboard");
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
                <i className="fa fa-check-circle"></i>
                {t("auth.successMsg")}
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

                <div className={styles.formGroup}>
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
                </div>

                <div className={styles.formOptions}>
                  <label className={styles.rememberMe}>
                    <input type="checkbox" /> {t("auth.rememberMe")}
                  </label>
                  <a href="#" className={styles.forgot}>
                    {t("auth.forgot")}
                  </a>
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

                <div className={groupClass("major")}>
                  <label htmlFor="reg-major">{t("auth.major")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-graduation-cap"></i>
                    <input type="text" id="reg-major" name="major" placeholder={t("auth.majorPh")} />
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errMajor")}</div>
                </div>

                <div className={groupClass("level")}>
                  <label htmlFor="reg-level">{t("auth.level")}</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fa fa-signal"></i>
                    <select id="reg-level" name="level" defaultValue="">
                      <option value="" disabled>
                        {t("auth.levelSelect")}
                      </option>
                      <option value="Freshman">{t("auth.lvFreshman")}</option>
                      <option value="Sophomore">{t("auth.lvSophomore")}</option>
                      <option value="Junior">{t("auth.lvJunior")}</option>
                      <option value="Senior">{t("auth.lvSenior")}</option>
                      <option value="Graduate">{t("auth.lvGraduate")}</option>
                    </select>
                  </div>
                  <div className={styles.errorMessage}>{t("auth.errLevel")}</div>
                </div>

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
            <button type="button" className={styles.googleBtn}>
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
