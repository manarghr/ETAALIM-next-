"use client";

import { useState, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { login } from "@/lib/auth";
import { isEmailTaken } from "@/lib/signupErrors";
import { registerMentor } from "@/lib/mentor";
import { createClient } from "@/lib/supabase/client";
import { TEACH_YEARS, TeachTier } from "@/data/mentors";

// One education cycle per mentor (they never span cycles); labels reuse the
// signup form's cycle keys.
const TEACH_TIERS: { tier: TeachTier; labelKey: string }[] = [
  { tier: "Primary", labelKey: "auth.cyclePrimary" },
  { tier: "Middle", labelKey: "auth.cycleMiddle" },
  { tier: "High School", labelKey: "auth.cycleHigh" },
  { tier: "University", labelKey: "auth.cycleUniversity" },
];
import s from "./AuthForm.module.css";
import m from "./MentorForm.module.css";

// Mentor registration — reuses the AuthForm card/input styling (s.*) for a look
// identical to sign-in, plus a few mentor-specific widgets (m.*).
export default function MentorForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  // form-level problem shown as a red banner (email already registered, …)
  const [formError, setFormError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [experience, setExperience] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  // teaching qualification — cycle + highest year in it
  const [teachTier, setTeachTier] = useState<TeachTier | "">("");
  const [teachYears, setTeachYears] = useState<string[]>([]);
  const toggleYear = (code: string) =>
    setTeachYears((ys) =>
      ys.includes(code) ? ys.filter((y) => y !== code) : [...ys, code]
    );

  const toggle = (id: string) => setShow((v) => ({ ...v, [id]: !v[id] }));
  const groupClass = (field: string) =>
    `${s.formGroup} ${errors[field] ? s.formGroupError : ""}`;

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) setSkills((k) => [...k, value]);
    setSkillInput("");
  };

  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const next: Record<string, boolean> = {};

    ["name", "email", "phone", "expertise", "level", "password"].forEach((f) => {
      if (!String(data.get(f) ?? "").trim()) next[f] = true;
    });
    if (String(data.get("password")) !== String(data.get("confirmPassword"))) {
      next.confirmPassword = true;
    }
    if (!teachTier) next.teachTier = true;
    if (teachTier && teachYears.length === 0) next.teachTop = true;
    if (!data.get("terms")) next.terms = true;

    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    // For the demo we onboard the professor straight away (no email review /
    // verification gate). Create their mentor account, start a session, and
    // drop them into their dashboard. Real verification lands with the backend.
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const expertise = String(data.get("expertise") ?? "").trim();
    const level = String(data.get("level") ?? "").trim();
    const password = String(data.get("password") ?? "");

    // ===== Real Supabase mentor account =====
    // The full profile rides along as metadata; a DB trigger (handle_new_user)
    // creates the profiles + mentors rows — so it works even with email
    // confirmation on (no session yet).
    const supabase = createClient();
    const { data: auth, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role: "mentor",
          name,
          phone,
          major: expertise,
          level,
          experience,
          skills: skills.join(", "),
          title: level ? `${level} · ${expertise}` : expertise,
          teaching_tier: teachTier || null,
          teaching_years: teachYears.length ? teachYears : null,
          profile_picture: photo || "/images/mentor-default.jpg",
        },
      },
    });
    // One account per email address — a second sign-up on an address that is
    // already taken (by a password OR a Google account) is refused.
    if (isEmailTaken(error, auth.user)) {
      setErrors({ email: true });
      setFormError(t("auth.emailTaken"));
      return;
    }
    if (error || !auth.user) {
      setFormError(error?.message ?? "Sign-up failed");
      return;
    }

    // Email confirmation on → no session yet: ask them to check their inbox.
    if (!auth.session) {
      alert(t("auth.checkEmail"));
      router.push("/login");
      return;
    }

    // Confirmation off → keep the localStorage account in sync and go straight in.
    const account = registerMentor({
      name,
      email,
      phone,
      expertise,
      level,
      experience,
      skills,
      photo,
      teaching: teachTier ? [{ tier: teachTier, years: teachYears }] : [],
    });
    login({ name: account.name, email: account.email, role: "mentor" });
    router.push("/mentor-dashboard");
  };

  return (
    <div className={s.authPage}>
      <div className="container">
        <div className={s.authGrid}>
          {/* Illustration */}
          <div className={s.illustration}>
            <SmartImage src="/images/mentor-illustration.svg" alt="" width={520} height={420} priority />
          </div>

          {/* Card */}
          <div className={`${s.card} ${m.card}`}>
            <div className={s.head}>
              <span className={m.badge}>
                <i className="fa fa-graduation-cap"></i> {t("mentorForm.badge")}
              </span>
              <h1>{t("mentorForm.title")}</h1>
              <p>{t("mentorForm.subtitle")}</p>
            </div>

            {formError && (
              <div className={s.alert}>
                <i className="fa fa-exclamation-circle"></i>
                <span>
                  {formError} <Link href="/login">{t("auth.switchLogin")}</Link>
                </span>
              </div>
            )}

            <form className={s.form} onSubmit={handleSubmit} noValidate>
              {/* Profile photo */}
              <div className={m.photoRow}>
                <div className={m.photoPreview}>
                  {/* A freshly picked file is a data: URL — SmartImage keeps it
                      on a plain <img>, which is the only thing that can show it. */}
                  {photo ? (
                    <SmartImage src={photo} alt="" width={120} height={120} />
                  ) : (
                    <i className="fa fa-user"></i>
                  )}
                  <label
                    htmlFor="mentor-photo"
                    className={m.photoBtn}
                    title={t("mentorForm.photoChange")}
                  >
                    <i className="fa fa-camera"></i>
                  </label>
                  <input
                    id="mentor-photo"
                    type="file"
                    accept="image/*"
                    className={m.hiddenFile}
                    onChange={onPhoto}
                  />
                </div>
                <div className={m.photoText}>
                  <span className={m.photoLabel}>{t("mentorForm.photoLabel")}</span>
                  <span className={m.photoHint}>{t("mentorForm.photoHint")}</span>
                  {photo && (
                    <button
                      type="button"
                      className={m.photoRemove}
                      onClick={() => setPhoto(null)}
                    >
                      <i className="fa fa-times"></i> {t("mentorForm.photoRemove")}
                    </button>
                  )}
                </div>
              </div>

              {/* Full name */}
              <div className={groupClass("name")}>
                <label htmlFor="mentor-name">{t("auth.fullName")}</label>
                <div className={s.inputWithIcon}>
                  <i className="fa fa-user"></i>
                  <input
                    id="mentor-name"
                    name="name"
                    type="text"
                    placeholder={t("auth.fullNamePh")}
                  />
                </div>
                <div className={s.errorMessage}>{t("auth.errName")}</div>
              </div>

              {/* Email + phone */}
              <div className={m.row}>
                <div className={groupClass("email")}>
                  <label htmlFor="mentor-email">{t("auth.emailLabel")}</label>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-envelope"></i>
                    <input
                      id="mentor-email"
                      name="email"
                      type="email"
                      placeholder={t("auth.emailPh")}
                    />
                  </div>
                  <div className={s.errorMessage}>{t("auth.errEmail")}</div>
                </div>
                <div className={groupClass("phone")}>
                  <label htmlFor="mentor-phone">{t("mentorForm.phone")}</label>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-phone"></i>
                    <input
                      id="mentor-phone"
                      name="phone"
                      type="tel"
                      placeholder={t("mentorForm.phonePh")}
                    />
                  </div>
                  <div className={s.errorMessage}>{t("auth.errPhone")}</div>
                </div>
              </div>

              {/* Field of expertise */}
              <div className={groupClass("expertise")}>
                <label htmlFor="mentor-expertise">{t("mentorForm.expertise")}</label>
                <div className={s.inputWithIcon}>
                  <i className="fa fa-graduation-cap"></i>
                  <input
                    id="mentor-expertise"
                    name="expertise"
                    type="text"
                    placeholder={t("mentorForm.expertisePh")}
                  />
                </div>
                <div className={s.errorMessage}>{t("mentorForm.errExpertise")}</div>
              </div>

              {/* Teaching level + highest year (covers this year and below) */}
              <div className={m.row}>
                <div className={groupClass("teachTier")}>
                  <label htmlFor="mentor-teach-tier">{t("mentorForm.teachCycle")}</label>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-sitemap"></i>
                    <select
                      id="mentor-teach-tier"
                      value={teachTier}
                      onChange={(e) => {
                        setTeachTier(e.target.value as TeachTier | "");
                        setTeachYears([]);
                      }}
                    >
                      <option value="" disabled>
                        {t("mentorForm.teachCycleSelect")}
                      </option>
                      {TEACH_TIERS.map((c) => (
                        <option key={c.tier} value={c.tier}>
                          {t(c.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={s.errorMessage}>{t("mentorForm.errTeachCycle")}</div>
                </div>

                <div className={groupClass("teachTop")}>
                  <label>{t("mentorForm.teachYearsLabel")}</label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      paddingTop: 4,
                    }}
                  >
                    {!teachTier && (
                      <span className={m.fieldHint}>
                        {t("mentorForm.teachCycleSelect")}
                      </span>
                    )}
                    {teachTier &&
                      TEACH_YEARS[teachTier].map((code) => {
                        const on = teachYears.includes(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleYear(code)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 999,
                              border: on
                                ? "1px solid var(--primary, #534ab7)"
                                : "1px solid #d1d5db",
                              background: on ? "var(--primary, #534ab7)" : "#fff",
                              color: on ? "#fff" : "inherit",
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            {code}
                          </button>
                        );
                      })}
                  </div>
                  <span className={m.fieldHint}>{t("mentorForm.teachYearsHint")}</span>
                  <div className={s.errorMessage}>{t("mentorForm.errTeachTop")}</div>
                </div>
              </div>

              {/* Qualification + experience */}
              <div className={m.row}>
                <div className={groupClass("level")}>
                  <label htmlFor="mentor-level">{t("mentorForm.level")}</label>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-certificate"></i>
                    <select id="mentor-level" name="level" defaultValue="">
                      <option value="" disabled>
                        {t("mentorForm.levelSelect")}
                      </option>
                      <option value="Bachelor">{t("mentorForm.lvBachelor")}</option>
                      <option value="Master">{t("mentorForm.lvMaster")}</option>
                      <option value="PhD">{t("mentorForm.lvPhd")}</option>
                      <option value="Teacher">{t("mentorForm.lvTeacher")}</option>
                      <option value="Professional">
                        {t("mentorForm.lvProfessional")}
                      </option>
                    </select>
                  </div>
                  <div className={s.errorMessage}>{t("mentorForm.errLevel")}</div>
                </div>

                <div className={s.formGroup}>
                  <label>{t("mentorForm.experience")}</label>
                  <div className={m.counter}>
                    <button
                      type="button"
                      onClick={() => setExperience((v) => Math.max(0, v - 1))}
                      disabled={experience === 0}
                      aria-label="decrease"
                    >
                      −
                    </button>
                    <span className={m.counterValue}>{experience}</span>
                    <button
                      type="button"
                      onClick={() => setExperience((v) => v + 1)}
                      aria-label="increase"
                    >
                      +
                    </button>
                    <input type="hidden" name="experience" value={experience} />
                  </div>
                  <span className={m.fieldHint}>{t("mentorForm.experienceHint")}</span>
                </div>
              </div>

              {/* Specialties / skills */}
              <div className={s.formGroup}>
                <label htmlFor="mentor-skill">{t("mentorForm.specialties")}</label>
                {skills.length > 0 && (
                  <div className={m.tags}>
                    {skills.map((tag) => (
                      <span key={tag} className={m.tag}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => setSkills((k) => k.filter((x) => x !== tag))}
                          aria-label="remove"
                        >
                          ×
                        </button>
                        <input type="hidden" name="skills" value={tag} />
                      </span>
                    ))}
                  </div>
                )}
                <div className={m.tagInput}>
                  <div className={s.inputWithIcon}>
                    <i className="fa fa-tags"></i>
                    <input
                      id="mentor-skill"
                      type="text"
                      placeholder={t("mentorForm.specialtiesPh")}
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={onSkillKey}
                    />
                  </div>
                  <button type="button" className={m.addBtn} onClick={addSkill}>
                    {t("mentorForm.addSkill")}
                  </button>
                </div>
              </div>

              {/* Password + confirm */}
              <div className={m.row}>
                <div className={groupClass("password")}>
                  <label htmlFor="mentor-password">{t("auth.passwordLabel")}</label>
                  <div className={`${s.inputWithIcon} ${s.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      id="mentor-password"
                      name="password"
                      type={show.pw ? "text" : "password"}
                      placeholder={t("auth.createPasswordPh")}
                    />
                    <button
                      type="button"
                      className={s.togglePassword}
                      onClick={() => toggle("pw")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.pw ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={s.errorMessage}>{t("auth.errPassword")}</div>
                </div>
                <div className={groupClass("confirmPassword")}>
                  <label htmlFor="mentor-confirm">{t("auth.confirmPassword")}</label>
                  <div className={`${s.inputWithIcon} ${s.passwordField}`}>
                    <i className="fa fa-lock"></i>
                    <input
                      id="mentor-confirm"
                      name="confirmPassword"
                      type={show.cf ? "text" : "password"}
                      placeholder={t("auth.confirmPh")}
                    />
                    <button
                      type="button"
                      className={s.togglePassword}
                      onClick={() => toggle("cf")}
                      aria-label="Toggle password"
                    >
                      <i className={`fa ${show.cf ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <div className={s.errorMessage}>{t("auth.errConfirm")}</div>
                </div>
              </div>

              {/* Terms */}
              <div className={`${groupClass("terms")} ${s.termsGroup}`}>
                <label className={s.checkboxContainer}>
                  <input type="checkbox" name="terms" />
                  {t("auth.agreePre")}{" "}
                  <Link href="/terms" className={s.termsLink} target="_blank">
                    {t("auth.terms")}
                  </Link>{" "}
                  {t("auth.and")}{" "}
                  <Link href="/privacy" className={s.termsLink} target="_blank">
                    {t("auth.privacy")}
                  </Link>
                </label>
                <div className={s.errorMessage}>{t("auth.errTerms")}</div>
              </div>

              <button type="submit" className={s.submitBtn}>
                {t("mentorForm.submit")}
              </button>
            </form>

            <p className={s.switch}>
              {t("mentorForm.haveAccount")}{" "}
              <Link href="/login">{t("mentorForm.loginLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
