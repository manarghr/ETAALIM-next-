"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const symbols: { cls: string; content: React.ReactNode }[] = [
  { cls: "symbolPlus", content: "+" },
  { cls: "symbolMinus", content: "−" },
  { cls: "symbolEquals", content: "=" },
  { cls: "symbolMultiply", content: "×" },
  { cls: "symbolDivide", content: "÷" },
  { cls: "symbolPi", content: "π" },
  { cls: "symbolSigma", content: "∑" },
  { cls: "symbolSqrt", content: "√" },
  { cls: "symbolBook", content: <i className="fas fa-book"></i> },
  { cls: "symbolGraduation", content: <i className="fas fa-graduation-cap"></i> },
  { cls: "symbolPencil", content: <i className="fas fa-pencil-alt"></i> },
  { cls: "symbolAtom", content: <i className="fas fa-atom"></i> },
];

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const toggle = (id: string) =>
    setShow((s) => ({ ...s, [id]: !s[id] }));

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

    // Backend wiring comes later; show the success confirmation for now.
    setSuccess(true);
    form.reset();
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Login submission will be connected to the backend later.
  };

  return (
    <div className={styles.page}>
      {/* Font Awesome 5 (this page uses the `fas` solid icon set) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
      />

      {/* Animated background */}
      <div className={styles.animatedBackground}>
        {symbols.map((s, i) => (
          <div
            key={i}
            className={`${styles.floatingSymbol} ${styles[s.cls]}`}
          >
            {s.content}
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        className={styles.closeBtn}
        title="Close"
        onClick={() => router.push("/")}
      >
        <i className="fas fa-times"></i>
      </button>

      {/* Welcome header */}
      <div className={styles.welcomeHeader}>
        <h1>Welcome to E-Taalim</h1>
        <p>
          <strong>
            Join our community of students and start your educational journey
            today!
          </strong>
        </p>
      </div>

      <div
        className={`${styles.loginContainer} ${
          mode === "register" ? styles.registerMode : styles.loginMode
        }`}
      >
        <div className={styles.formContainer}>
          <div className={styles.formContent}>
            {/* Tabs */}
            <div className={styles.authTabs}>
              <div
                className={`${styles.tabSlider} ${
                  mode === "register" ? styles.tabSliderRegister : ""
                }`}
              ></div>
              <button
                className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={`${styles.tab} ${
                  mode === "register" ? styles.tabActive : ""
                }`}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>

            {mode === "register" && (
              <div className={styles.userTypeContainer}>
                <button className={styles.userTypeBtn}>Student</button>
              </div>
            )}

            {/* Success Message */}
            <div
              className={`${styles.successMessage} ${
                success ? styles.successMessageShow : ""
              }`}
            >
              <span className={styles.successIcon}>
                <i className="fas fa-check-circle"></i>
              </span>
              Registration successful! Please check your email to verify your
              account.
            </div>

            {/* Login Form */}
            {mode === "login" && (
              <form className={styles.loginFormContainer} onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                  <label htmlFor="login-email">Email Address</label>
                  <div className={styles.inputWithIcon}>
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      id="login-email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="login-password">Password</label>
                  <div
                    className={`${styles.inputWithIcon} ${styles.passwordInputContainer}`}
                  >
                    <i className="fas fa-lock"></i>
                    <input
                      type={show.login ? "text" : "password"}
                      id="login-password"
                      placeholder="Enter your password"
                      required
                    />
                    <span
                      className={styles.togglePassword}
                      onClick={() => toggle("login")}
                    >
                      {show.login ? "👁️‍🗨️" : "👁️"}
                    </span>
                  </div>
                </div>

                <div className={styles.formOptions}>
                  <label className={styles.rememberMe}>
                    <input type="checkbox" /> Remember me
                  </label>
                  <a href="#" className={styles.forgotPassword}>
                    Forgot Password?
                  </a>
                </div>

                <button type="submit" className={styles.btnPrimary}>
                  Login
                </button>
              </form>
            )}

            {/* Registration Form */}
            {mode === "register" && (
              <form onSubmit={handleRegister} noValidate>
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>
                    Personal Information
                  </h3>

                  <div className={groupClass("name")}>
                    <label htmlFor="reg-name">Full Name</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        id="reg-name"
                        name="name"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className={styles.errorMessage}>
                      Please enter your full name
                    </div>
                  </div>

                  <div className={groupClass("email")}>
                    <label htmlFor="reg-email">Email Address</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        id="reg-email"
                        name="email"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div className={styles.errorMessage}>
                      Please enter a valid email address
                    </div>
                  </div>

                  <div className={groupClass("phone")}>
                    <label htmlFor="reg-phone">Phone Number</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fas fa-phone"></i>
                      <input
                        type="tel"
                        id="reg-phone"
                        name="phone"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className={styles.errorMessage}>
                      Please enter a valid phone number
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>
                    Academic Information
                  </h3>

                  <div className={groupClass("major")}>
                    <label htmlFor="reg-major">Major</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fas fa-graduation-cap"></i>
                      <input
                        type="text"
                        id="reg-major"
                        name="major"
                        placeholder="Enter your major"
                      />
                    </div>
                    <div className={styles.errorMessage}>
                      Please enter your major
                    </div>
                  </div>

                  <div className={groupClass("level")}>
                    <label htmlFor="reg-level">Education Level</label>
                    <div className={styles.inputWithIcon}>
                      <i className="fas fa-level-up-alt"></i>
                      <select id="reg-level" name="level" defaultValue="">
                        <option value="" disabled>
                          Select your level
                        </option>
                        <option value="Freshman">Freshman</option>
                        <option value="Sophomore">Sophomore</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    </div>
                    <div className={styles.errorMessage}>
                      Please select your education level
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>
                    Account Information
                  </h3>

                  <div className={groupClass("password")}>
                    <label htmlFor="reg-password">Password</label>
                    <div
                      className={`${styles.inputWithIcon} ${styles.passwordInputContainer}`}
                    >
                      <i className="fas fa-lock"></i>
                      <input
                        type={show.reg ? "text" : "password"}
                        id="reg-password"
                        name="password"
                        placeholder="Create a password"
                      />
                      <span
                        className={styles.togglePassword}
                        onClick={() => toggle("reg")}
                      >
                        {show.reg ? "👁️‍🗨️" : "👁️"}
                      </span>
                    </div>
                    <div className={styles.errorMessage}>
                      Password must be at least 8 characters
                    </div>
                  </div>

                  <div className={groupClass("confirmPassword")}>
                    <label htmlFor="reg-confirm-password">Confirm Password</label>
                    <div
                      className={`${styles.inputWithIcon} ${styles.passwordInputContainer}`}
                    >
                      <i className="fas fa-lock"></i>
                      <input
                        type={show.confirm ? "text" : "password"}
                        id="reg-confirm-password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                      />
                      <span
                        className={styles.togglePassword}
                        onClick={() => toggle("confirm")}
                      >
                        {show.confirm ? "👁️‍🗨️" : "👁️"}
                      </span>
                    </div>
                    <div className={styles.errorMessage}>
                      Passwords do not match
                    </div>
                  </div>

                  <div className={`${groupClass("terms")} ${styles.termsGroup}`}>
                    <label className={styles.checkboxContainer}>
                      <input type="checkbox" name="terms" />
                      <span className={styles.checkmark}></span>I agree to the{" "}
                      <a href="#" className={styles.termsLink}>
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className={styles.termsLink}>
                        Privacy Policy
                      </a>
                    </label>
                    <div className={styles.errorMessage}>
                      You must agree to the terms
                    </div>
                  </div>
                </div>

                <button type="submit" className={styles.btnPrimary}>
                  Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
