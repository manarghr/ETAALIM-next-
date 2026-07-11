"use client";

import { useState, FormEvent, ChangeEvent, KeyboardEvent } from "react";
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
  { cls: "symbolChalkboard", content: <i className="fas fa-chalkboard-teacher"></i> },
  { cls: "symbolApple", content: <i className="fas fa-apple-alt"></i> },
  { cls: "symbolCertificate", content: <i className="fas fa-certificate"></i> },
  { cls: "symbolAward", content: <i className="fas fa-award"></i> },
  { cls: "symbolUniversity", content: <i className="fas fa-university"></i> },
  { cls: "symbolGlasses", content: <i className="fas fa-glasses"></i> },
  { cls: "symbolBrain", content: <i className="fas fa-brain"></i> },
  { cls: "symbolLightbulb", content: <i className="fas fa-lightbulb"></i> },
  { cls: "symbolMicroscope", content: <i className="fas fa-microscope"></i> },
  { cls: "symbolFlask", content: <i className="fas fa-flask"></i> },
];

export default function MentorFormPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [experience, setExperience] = useState(0);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const toggle = (id: string) => setShow((s) => ({ ...s, [id]: !s[id] }));
  const groupClass = (field: string) =>
    `${styles.formGroup} ${errors[field] ? styles.formGroupError : ""}`;

  const imgTransform = { transform: `scale(${zoom / 100}) rotate(${rotate}deg)` };

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (value && !specialties.includes(value)) {
      setSpecialties((s) => [...s, value]);
    }
    setSpecialtyInput("");
  };

  const onSpecialtyKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSpecialty();
    }
  };

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Record<string, boolean> = {};

    ["name", "email", "phone", "major", "level", "password"].forEach((f) => {
      if (!String(data.get(f) ?? "").trim()) next[f] = true;
    });
    if (String(data.get("password")) !== String(data.get("confirmPassword"))) {
      next.confirmPassword = true;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Backend wiring comes later; show the success confirmation for now.
    setSuccess(true);
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
          <div key={i} className={`${styles.floatingSymbol} ${styles[s.cls]}`}>
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
            our community of expert mentors and help shape the future of
            education.
          </strong>
        </p>
      </div>

      <div
        className={`${styles.loginContainer} ${
          mode === "register" ? styles.registerMode : styles.loginMode
        }`}
      >
        {/* Image side (register only) */}
        {mode === "register" && (
          <div className={styles.imageContainer}>
            <div className={styles.imageContent}>
              <h3>Join Our Teaching Community</h3>
              <p>
                Share your knowledge and expertise with students around the
                world. Become a mentor today!
              </p>
            </div>
            <div className={styles.imagePlaceholder}>
              {imageSrc ? (
                <img
                  className={styles.previewLarge}
                  src={imageSrc}
                  alt="Profile preview"
                  style={imgTransform}
                />
              ) : (
                <span>
                  <i className="fas fa-user-circle fa-3x"></i>
                </span>
              )}
            </div>
            <p className={styles.uploadInstructions}>
              Upload your professional photo
            </p>
            <p className={styles.uploadHint}>
              This will be displayed on your mentor profile
            </p>

            <div
              className={`${styles.imageEditorControls} ${
                imageSrc ? styles.imageEditorControlsShow : ""
              }`}
            >
              <div className={styles.controlGroup}>
                <label htmlFor="zoom-slider">Zoom</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    id="zoom-slider"
                    min={50}
                    max={150}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                  <span className={styles.sliderValue}>{zoom}%</span>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <label htmlFor="rotate-slider">Rotate</label>
                <div className={styles.sliderContainer}>
                  <input
                    type="range"
                    id="rotate-slider"
                    min={-180}
                    max={180}
                    value={rotate}
                    onChange={(e) => setRotate(Number(e.target.value))}
                  />
                  <span className={styles.sliderValue}>{rotate}°</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form side */}
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
                <button className={styles.userTypeBtn}>Mentor</button>
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
              <form
                className={styles.loginFormContainer}
                onSubmit={(e) => e.preventDefault()}
              >
                <div className={styles.formGroup}>
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="login-password">Password</label>
                  <div className={styles.passwordInputContainer}>
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
                  <h3 className={styles.formSectionTitle}>Profile Information</h3>

                  {/* Profile picture */}
                  <div className={`${styles.formGroup} ${styles.profilePictureGroup}`}>
                    <label>Profile Picture</label>
                    <div className={styles.profilePictureContainer}>
                      <div className={styles.profilePicturePreview}>
                        {imageSrc ? (
                          <img
                            className={styles.profilePreview}
                            src={imageSrc}
                            alt="Profile preview"
                            style={imgTransform}
                          />
                        ) : (
                          <span className={styles.profilePlaceholder}>
                            <i className="fas fa-user"></i>
                          </span>
                        )}
                      </div>
                      <div className={styles.profileUploadBtn}>
                        <label htmlFor="profile-upload" className={styles.uploadLabel}>
                          <i className="fas fa-camera"></i>
                        </label>
                        <input
                          type="file"
                          id="profile-upload"
                          name="profile_picture"
                          accept="image/*"
                          className={styles.hiddenUpload}
                          onChange={handleImage}
                          title="Upload your profile picture"
                        />
                      </div>
                    </div>
                    <p className={styles.uploadHint}>
                      Professional headshot recommended (square image)
                    </p>
                  </div>

                  <div className={groupClass("name")}>
                    <label htmlFor="reg-name">Full Name</label>
                    <input
                      type="text"
                      id="reg-name"
                      name="name"
                      placeholder="Enter your full name"
                    />
                    <div className={styles.errorMessage}>
                      Please enter your full name
                    </div>
                  </div>

                  <div className={groupClass("email")}>
                    <label htmlFor="reg-email">Email Address</label>
                    <input
                      type="email"
                      id="reg-email"
                      name="email"
                      placeholder="Enter your email address"
                    />
                    <div className={styles.errorMessage}>
                      Please enter a valid email address
                    </div>
                  </div>

                  <div className={groupClass("phone")}>
                    <label htmlFor="reg-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="reg-phone"
                      name="phone"
                      placeholder="Enter your phone number"
                    />
                    <div className={styles.errorMessage}>
                      Please enter a valid phone number
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>
                    Professional Information
                  </h3>

                  <div className={groupClass("major")}>
                    <label htmlFor="reg-major">Field of Expertise</label>
                    <input
                      type="text"
                      id="reg-major"
                      name="major"
                      placeholder="E.g., Computer Science, Mathematics"
                    />
                    <div className={styles.errorMessage}>
                      Please enter your field of expertise
                    </div>
                  </div>

                  <div className={groupClass("level")}>
                    <label htmlFor="reg-level">Education Level</label>
                    <input
                      type="text"
                      id="reg-level"
                      name="level"
                      placeholder="E.g., PhD, Master's Degree"
                    />
                    <div className={styles.errorMessage}>
                      Please enter your education level
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="experience">
                      Years of Experience
                      <span className={styles.tooltip}>
                        ⓘ
                        <span className={styles.tooltipText}>
                          How many years have you been teaching or working in
                          your field?
                        </span>
                      </span>
                    </label>
                    <div className={styles.experienceCounter}>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        disabled={experience === 0}
                        onClick={() => setExperience((v) => Math.max(0, v - 1))}
                      >
                        -
                      </button>
                      <div className={styles.counterValue}>{experience}</div>
                      <input type="hidden" name="experience" value={experience} />
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() => setExperience((v) => v + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Specialties/Skills</label>
                    <div className={styles.specialtyTags}>
                      {specialties.map((tag) => (
                        <span key={tag} className={styles.specialtyTag}>
                          {tag}
                          <span
                            className={styles.removeTag}
                            onClick={() =>
                              setSpecialties((s) => s.filter((t) => t !== tag))
                            }
                          >
                            ×
                          </span>
                          <input type="hidden" name="skills[]" value={tag} />
                        </span>
                      ))}
                    </div>
                    <div className={styles.addSpecialty}>
                      <input
                        type="text"
                        id="specialty-input"
                        placeholder="Add a specialty or skill"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyDown={onSpecialtyKey}
                      />
                      <button
                        type="button"
                        id="add-specialty-btn"
                        onClick={addSpecialty}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Account Information</h3>

                  <div className={groupClass("password")}>
                    <label htmlFor="reg-password">Password</label>
                    <div className={styles.passwordInputContainer}>
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
                    <div className={styles.passwordInputContainer}>
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
