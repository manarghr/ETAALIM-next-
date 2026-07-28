"use client";

// Step 2 of a Google sign-up. Google hands us a name, an email and a photo —
// never a role, a school year or a phone number. This page asks for the missing
// pieces once, writes them onto the profile row that already exists, and then
// sends the person to their dashboard. Password sign-ups never land here: their
// form already collected everything.
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { login } from "@/lib/auth";
import { setIdentity } from "@/lib/student";
import { tr } from "@/data/localized";
import { CYCLES, YEARS, streamsForYear, Cycle } from "@/data/education";
import { TEACH_YEARS, TeachTier } from "@/data/mentors";
import {
  getOnboardingState,
  completeStudentOnboarding,
  completeMentorOnboarding,
  OnboardingState,
} from "@/lib/onboarding";
import PageLoader from "@/components/PageLoader";
import SmartImage from "@/components/SmartImage";
import s from "@/components/AuthForm.module.css";
import m from "@/components/MentorForm.module.css";

const TEACH_TIERS: { tier: TeachTier; labelKey: string }[] = [
  { tier: "Primary", labelKey: "auth.cyclePrimary" },
  { tier: "Middle", labelKey: "auth.cycleMiddle" },
  { tier: "High School", labelKey: "auth.cycleHigh" },
  { tier: "University", labelKey: "auth.cycleUniversity" },
];

const LEVELS = [
  { value: "Bachelor's Degree", labelKey: "mentorForm.lvBachelor" },
  { value: "Master's Degree", labelKey: "mentorForm.lvMaster" },
  { value: "PhD / Doctorate", labelKey: "mentorForm.lvPhd" },
  { value: "Certified Teacher", labelKey: "mentorForm.lvTeacher" },
  { value: "Industry Professional", labelKey: "mentorForm.lvProfessional" },
];

export default function WelcomeClient() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [role, setRole] = useState<"student" | "mentor">("student");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // student
  const [age, setAge] = useState("");
  const [cycle, setCycle] = useState<Cycle | "">("");
  const [year, setYear] = useState("");
  const [stream, setStream] = useState("");
  const [uniMajor, setUniMajor] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  // mentor
  const [expertise, setExpertise] = useState("");
  const [level, setLevel] = useState("");
  const [experience, setExperience] = useState(0);
  const [teachTier, setTeachTier] = useState<TeachTier | "">("");
  const [teachYears, setTeachYears] = useState<string[]>([]);

  const ageNum = parseInt(age, 10);
  const isMinorAge = Number.isFinite(ageNum) && ageNum < 18;
  const groupClass = (field: string) =>
    `${s.formGroup} ${errors[field] ? s.formGroupError : ""}`;

  // Who is this, and is there actually anything left to ask?
  useEffect(() => {
    getOnboardingState().then((data) => {
      if (!data) {
        router.replace("/login");
        return;
      }
      if (data.complete) {
        router.replace(data.role === "mentor" ? "/mentor-dashboard" : "/dashboard");
        return;
      }
      setState(data);
      setName(data.name);
      setPhone(data.phone);
      setChecked(true);
    });
  }, [router]);

  const toggleYear = (code: string) =>
    setTeachYears((ys) =>
      ys.includes(code) ? ys.filter((y) => y !== code) : [...ys, code]
    );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!state) return;
    const next: Record<string, boolean> = {};

    if (!name.trim()) next.name = true;
    if (!phone.trim()) next.phone = true;

    if (role === "student") {
      if (!Number.isFinite(ageNum) || ageNum < 3 || ageNum > 100) next.age = true;
      if (isMinorAge && !parentEmail.trim()) next.parentEmail = true;
      if (isMinorAge && !parentPhone.trim()) next.parentPhone = true;
      if (!cycle) next.cycle = true;
      if (cycle && !year) next.year = true;
      if (cycle === "high" && !stream) next.stream = true;
      if (cycle === "university" && !uniMajor.trim()) next.uniMajor = true;
    } else {
      if (!expertise.trim()) next.expertise = true;
      if (!level) next.level = true;
      if (!teachTier) next.teachTier = true;
      if (teachTier && teachYears.length === 0) next.teachTop = true;
    }

    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const error =
      role === "student"
        ? await completeStudentOnboarding({
            name: name.trim(),
            phone: phone.trim(),
            age: ageNum,
            parentEmail: isMinorAge ? parentEmail.trim() : null,
            parentPhone: isMinorAge ? parentPhone.trim() : null,
            cycle,
            year,
            stream:
              cycle === "high"
                ? stream
                : cycle === "university"
                ? uniMajor.trim()
                : null,
          })
        : await completeMentorOnboarding({
            name: name.trim(),
            phone: phone.trim(),
            major: expertise.trim(),
            level,
            experience,
            teachingTier: teachTier,
            teachingYears: teachYears,
            profilePicture: state.avatar,
          });
    setSaving(false);

    if (error) {
      setFormError(error);
      return;
    }

    // Keep the localStorage session in step so the header and the mentor
    // dashboard (still partly localStorage-backed) see the right person.
    login({ name: name.trim(), email: state.email, role });
    setIdentity(name.trim(), state.email);
    router.push(role === "mentor" ? "/mentor-dashboard" : "/dashboard");
  };

  // Don't flash the form before we know whether it's even needed.
  if (!checked) return <PageLoader />;

  return (
    <div className={s.authPage}>
      <div className="container">
        <div className={s.authGrid}>
          <div className={s.illustration}>
            <SmartImage src="/images/auth-register.svg" alt="" width={520} height={420} priority />
          </div>

          <div className={s.card}>
            <div className={s.head}>
              <h1>{t("welcome.title")}</h1>
              <p>{t("welcome.subtitle", { email: state?.email ?? "" })}</p>
            </div>

            {formError && (
              <div className={s.alert}>
                <i className="fa fa-exclamation-circle"></i>
                {formError}
              </div>
            )}

            <form className={s.form} onSubmit={handleSubmit} noValidate>
              {/* Student or teacher? Google can't tell us. */}
              <div className={s.formGroup}>
                <label>{t("welcome.roleLabel")}</label>
                <div className={m.chipRow}>
                  <button
                    type="button"
                    className={`${m.chip} ${role === "student" ? m.chipOn : ""}`}
                    onClick={() => setRole("student")}
                  >
                    <i className="fa fa-user"></i> {t("welcome.roleStudent")}
                  </button>
                  <button
                    type="button"
                    className={`${m.chip} ${role === "mentor" ? m.chipOn : ""}`}
                    onClick={() => setRole("mentor")}
                  >
                    <i className="fa fa-graduation-cap"></i> {t("welcome.roleMentor")}
                  </button>
                </div>
              </div>

              <div className={groupClass("name")}>
                <label htmlFor="w-name">{t("auth.fullName")}</label>
                <div className={s.inputWithIcon}>
                  <i className="fa fa-user"></i>
                  <input
                    id="w-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.fullNamePh")}
                  />
                </div>
                <div className={s.errorMessage}>{t("auth.errName")}</div>
              </div>

              <div className={groupClass("phone")}>
                <label htmlFor="w-phone">{t("auth.phone")}</label>
                <div className={s.inputWithIcon}>
                  <i className="fa fa-phone"></i>
                  <input
                    id="w-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("auth.phonePh")}
                  />
                </div>
                <div className={s.errorMessage}>{t("auth.errPhone")}</div>
              </div>

              {role === "student" && (
                <>
                  <div className={groupClass("age")}>
                    <label htmlFor="w-age">{t("auth.age")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-birthday-cake"></i>
                      <input
                        id="w-age"
                        type="number"
                        min={3}
                        max={100}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder={t("auth.agePh")}
                      />
                    </div>
                    <div className={s.errorMessage}>{t("auth.errAge")}</div>
                  </div>

                  {isMinorAge && (
                    <>
                      <div className={groupClass("parentEmail")}>
                        <label htmlFor="w-parent">{t("auth.parentEmail")}</label>
                        <div className={s.inputWithIcon}>
                          <i className="fa fa-shield"></i>
                          <input
                            id="w-parent"
                            type="email"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            placeholder={t("auth.parentEmailPh")}
                          />
                        </div>
                        <p className={s.fieldHint}>{t("auth.parentEmailHint")}</p>
                        <div className={s.errorMessage}>{t("auth.errParentEmail")}</div>
                      </div>

                      <div className={groupClass("parentPhone")}>
                        <label htmlFor="w-parent-phone">{t("auth.parentPhone")}</label>
                        <div className={s.inputWithIcon}>
                          <i className="fa fa-phone"></i>
                          <input
                            id="w-parent-phone"
                            type="tel"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            placeholder={t("auth.parentPhonePh")}
                          />
                        </div>
                        <div className={s.errorMessage}>{t("auth.errParentPhone")}</div>
                      </div>
                    </>
                  )}

                  <div className={groupClass("cycle")}>
                    <label htmlFor="w-cycle">{t("auth.cycle")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-graduation-cap"></i>
                      <select
                        id="w-cycle"
                        value={cycle}
                        onChange={(e) => {
                          setCycle(e.target.value as Cycle | "");
                          setYear("");
                          setStream("");
                        }}
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
                    <div className={s.errorMessage}>{t("auth.errCycle")}</div>
                  </div>

                  {cycle && (
                    <div className={groupClass("year")}>
                      <label htmlFor="w-year">{t("auth.yearLabel")}</label>
                      <div className={s.inputWithIcon}>
                        <i className="fa fa-calendar"></i>
                        <select
                          id="w-year"
                          value={year}
                          onChange={(e) => {
                            setYear(e.target.value);
                            setStream("");
                          }}
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
                      <div className={s.errorMessage}>{t("auth.errYear")}</div>
                    </div>
                  )}

                  {cycle === "high" && year && (
                    <div className={groupClass("stream")}>
                      <label htmlFor="w-stream">{t("auth.stream")}</label>
                      <div className={s.inputWithIcon}>
                        <i className="fa fa-flask"></i>
                        <select
                          id="w-stream"
                          value={stream}
                          onChange={(e) => setStream(e.target.value)}
                        >
                          <option value="" disabled>
                            {t("auth.streamSelect")}
                          </option>
                          {streamsForYear(year).map((x) => (
                            <option key={x} value={x}>
                              {tr(x, locale)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={s.errorMessage}>{t("auth.errStream")}</div>
                    </div>
                  )}

                  {cycle === "university" && (
                    <div className={groupClass("uniMajor")}>
                      <label htmlFor="w-unimajor">{t("auth.uniMajorLabel")}</label>
                      <div className={s.inputWithIcon}>
                        <i className="fa fa-book"></i>
                        <input
                          id="w-unimajor"
                          type="text"
                          value={uniMajor}
                          onChange={(e) => setUniMajor(e.target.value)}
                          placeholder={t("auth.uniMajorPh")}
                        />
                      </div>
                      <div className={s.errorMessage}>{t("auth.errUniMajor")}</div>
                    </div>
                  )}
                </>
              )}

              {role === "mentor" && (
                <>
                  <div className={groupClass("expertise")}>
                    <label htmlFor="w-expertise">{t("mentorForm.expertise")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-lightbulb-o"></i>
                      <input
                        id="w-expertise"
                        type="text"
                        value={expertise}
                        onChange={(e) => setExpertise(e.target.value)}
                        placeholder={t("mentorForm.expertisePh")}
                      />
                    </div>
                    <div className={s.errorMessage}>{t("mentorForm.errExpertise")}</div>
                  </div>

                  <div className={groupClass("level")}>
                    <label htmlFor="w-level">{t("mentorForm.level")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-certificate"></i>
                      <select
                        id="w-level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        <option value="" disabled>
                          {t("mentorForm.levelSelect")}
                        </option>
                        {LEVELS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {t(l.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={s.errorMessage}>{t("mentorForm.errLevel")}</div>
                  </div>

                  <div className={s.formGroup}>
                    <label htmlFor="w-exp">{t("mentorForm.experience")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-clock-o"></i>
                      <input
                        id="w-exp"
                        type="number"
                        min={0}
                        max={60}
                        value={experience}
                        onChange={(e) => setExperience(Number(e.target.value))}
                      />
                    </div>
                    <p className={s.fieldHint}>{t("mentorForm.experienceHint")}</p>
                  </div>

                  <div className={groupClass("teachTier")}>
                    <label htmlFor="w-tier">{t("mentorForm.teachCycle")}</label>
                    <div className={s.inputWithIcon}>
                      <i className="fa fa-university"></i>
                      <select
                        id="w-tier"
                        value={teachTier}
                        onChange={(e) => {
                          setTeachTier(e.target.value as TeachTier | "");
                          setTeachYears([]);
                        }}
                      >
                        <option value="" disabled>
                          {t("mentorForm.teachCycleSelect")}
                        </option>
                        {TEACH_TIERS.map((x) => (
                          <option key={x.tier} value={x.tier}>
                            {t(x.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={s.errorMessage}>{t("mentorForm.errTeachCycle")}</div>
                  </div>

                  {teachTier && (
                    <div className={groupClass("teachTop")}>
                      <label>{t("mentorForm.teachYearsLabel")}</label>
                      <div className={m.chipRow}>
                        {TEACH_YEARS[teachTier].map((code) => (
                          <button
                            key={code}
                            type="button"
                            className={`${m.chip} ${
                              teachYears.includes(code) ? m.chipOn : ""
                            }`}
                            onClick={() => toggleYear(code)}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      <p className={s.fieldHint}>{t("mentorForm.teachYearsHint")}</p>
                      <div className={s.errorMessage}>{t("mentorForm.errTeachTop")}</div>
                    </div>
                  )}
                </>
              )}

              <button type="submit" className={s.submitBtn} disabled={saving}>
                {saving ? t("welcome.saving") : t("welcome.submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
