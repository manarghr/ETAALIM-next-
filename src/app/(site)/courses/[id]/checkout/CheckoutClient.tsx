"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { Course, JoinOption, getJoinOption, formatDZD } from "@/data/courses";
import { effectiveCourse } from "@/lib/catalog";
import { getMentorById } from "@/data/mentors";
import { tr, mentorDisplayName } from "@/data/localized";
import { addEnrollment } from "@/lib/enrollment";
import {createClient} from "@/lib/supabase/client";
import { useI18n } from "@/i18n/I18nProvider";
import CourseBanner from "@/components/CourseBanner";
import styles from "./page.module.css";

type Method = "baridimob" | "cib";

export default function CheckoutClient({
  course,
  option,
}: {
  course: Course;
  option: JoinOption;
}) {
  const { t, locale } = useI18n();
  const [method, setMethod] = useState<Method>("baridimob");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Apply the admin's live price/subject edits (stored client-side) on mount.
  const [liveCourse, setLiveCourse] = useState<Course>(course);
  useEffect(() => {
    effectiveCourse(course.id).then((eff) => {
      if (eff) setLiveCourse(eff);
    });
  }, [course.id]);
  const liveOption = getJoinOption(liveCourse, option.mode);

  const mentor = getMentorById(liveCourse.mentorId);
  const teacher = mentor ? mentorDisplayName(mentor, locale) : "";
  const subject = tr(liveCourse.subject, locale);
  const optionTitle = tr(option.title, locale);
  const price = formatDZD(liveOption.price, locale);

   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data: ref, error: rpcError } = await supabase.rpc("enroll_in_course", {
      p_course_id: liveCourse.id,
      p_mode: option.mode,
      p_price: liveOption.price,
      p_subject: liveCourse.subject,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
     addEnrollment({
      courseId: liveCourse.id,
      mode: option.mode,
      ref: ref as string,
      date: new Date().toISOString(),
    });

    setOrderRef(ref as string);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className="container">
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <i className="fa fa-check"></i>
            </div>
            <h2>{t("checkout.thankYou")}</h2>
            <p>{t("checkout.enrolledIn", { course: subject, option: optionTitle })}</p>
            <p className={styles.unlockNote}>
              <i className="fa fa-unlock-alt"></i> {t("checkout.unlockNote")}
            </p>
            <div className={styles.orderRef}>
              {t("checkout.orderRef", { ref: orderRef })}
            </div>
            <div className={styles.successActions}>
              <Link href={`/courses/${course.id}`} className="btn btn-primary">
                {t("checkout.backToCourse")} <i className="fa fa-arrow-right"></i>
              </Link>
              <Link href="/courses" className="btn btn-secondary">
                {t("checkout.browseMore")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className="container">
        <Link href={`/courses/${course.id}`} className={styles.back}>
          <i className="fa fa-angle-left"></i> {t("checkout.back")}
        </Link>

        <h1 className={styles.heading}>{t("checkout.title")}</h1>
        <p className={styles.subheading}>{t("checkout.subtitle")}</p>

        <div className={styles.layout}>
          {/* Payment column */}
          <form onSubmit={handleSubmit}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>{t("checkout.methodTitle")}</h2>
              <div className={styles.methodList}>
                <label
                  className={`${styles.methodCard} ${
                    method === "baridimob" ? styles.methodCardActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={method === "baridimob"}
                    onChange={() => setMethod("baridimob")}
                    hidden
                  />
                  <span className={styles.methodRadio}></span>
                  <span className={`${styles.methodLogo} ${styles.baridi}`}>
                    <i className="fa fa-mobile"></i>
                  </span>
                  <span className={styles.methodInfo}>
                    <span className={styles.methodName}>
                      {t("checkout.baridiName")}
                    </span>
                    <span className={styles.methodDesc}>
                      {t("checkout.baridiDesc")}
                    </span>
                  </span>
                </label>

                <label
                  className={`${styles.methodCard} ${
                    method === "cib" ? styles.methodCardActive : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={method === "cib"}
                    onChange={() => setMethod("cib")}
                    hidden
                  />
                  <span className={styles.methodRadio}></span>
                  <span className={`${styles.methodLogo} ${styles.cib}`}>
                    <i className="fa fa-credit-card"></i>
                  </span>
                  <span className={styles.methodInfo}>
                    <span className={styles.methodName}>{t("checkout.cibName")}</span>
                    <span className={styles.methodDesc}>{t("checkout.cibDesc")}</span>
                  </span>
                </label>
              </div>

              {/* Method-specific fields */}
              {method === "baridimob" ? (
                <>
                  <div className={styles.fields}>
                    <div className={styles.field}>
                      <label htmlFor="ccp">{t("checkout.ccpLabel")}</label>
                      <input
                        id="ccp"
                        type="text"
                        placeholder="00799999 0004567891 23"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="phone">{t("checkout.phoneLabel")}</label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="05 55 55 55 55"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.hint}>
                    <i className="fa fa-info-circle"></i>
                    <span>{t("checkout.baridiHint")}</span>
                  </div>
                </>
              ) : (
                <div className={styles.fields}>
                  <div className={styles.field}>
                    <label htmlFor="card">{t("checkout.cardLabel")}</label>
                    <input
                      id="card"
                      type="text"
                      inputMode="numeric"
                      placeholder="6280 5811 1234 5678"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="holder">{t("checkout.holderLabel")}</label>
                    <input
                      id="holder"
                      type="text"
                      placeholder={t("checkout.holderPh")}
                      required
                    />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label htmlFor="exp">{t("checkout.expLabel")}</label>
                      <input id="exp" type="text" placeholder="MM / YY" required />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="cvv">{t("checkout.cvvLabel")}</label>
                      <input id="cvv" type="text" inputMode="numeric" placeholder="123" required />
                    </div>
                  </div>
                </div>
              )}

             {error && (
                <p style={{ color: "#dc3545", marginBottom: 12, fontWeight: 600 }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className={`btn btn-primary ${styles.payBtn}`}
                disabled={submitting}
              >
                {submitting
                  ? t("checkout.processing")
                  : t("checkout.pay", { amount: price })}
              </button>
              <p className={styles.secure}>
                <i className="fa fa-lock"></i> {t("checkout.secure")}
              </p>
            </div>
          </form>

          {/* Order summary */}
          <aside className={styles.summary}>
            <h3>{t("checkout.summary")}</h3>
            <div className={styles.courseLine}>
              <div className={styles.courseThumb}>
                <CourseBanner subject={course.major} seed={course.id} />
              </div>
              <div>
                <div className={styles.cName}>{subject}</div>
                <div className={styles.cMeta}>
                  {t("checkout.summaryMeta", {
                    tier: tr(course.tier, locale),
                    teacher,
                  })}
                </div>
                <span className={styles.optionPill}>
                  <i className={`fa ${option.icon}`}></i> {optionTitle}
                </span>
              </div>
            </div>
            <div className={styles.sumRow}>
              <span>{optionTitle}</span>
              <span>{price}</span>
            </div>
            <div className={styles.sumRow}>
              <span>{t("checkout.platformFee")}</span>
              <span>{formatDZD(0, locale)}</span>
            </div>
            <div className={styles.sumTotal}>
              <span className={styles.tLabel}>{t("checkout.total")}</span>
              <span className={styles.tValue}>{price}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
