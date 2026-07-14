"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Course, JoinOption, formatDZD } from "@/data/courses";
import CourseBanner from "@/components/CourseBanner";
import styles from "./page.module.css";

type Method = "baridimob" | "cib";

export default function CheckoutClient({
  course,
  option,
  teacher,
}: {
  course: Course;
  option: JoinOption;
  teacher: string;
}) {
  const [method, setMethod] = useState<Method>("baridimob");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Payment processing is mocked until the backend is connected.
    setTimeout(() => {
      setOrderRef("ET-" + Math.floor(100000 + Math.random() * 900000));
      setSubmitting(false);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1500);
  };

  if (done) {
    return (
      <div className={styles.wrap}>
        <div className="container">
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <i className="fa fa-check"></i>
            </div>
            <h2>Payment successful!</h2>
            <p>
              You&apos;re enrolled in <b>{course.subject}</b> — {option.title}.
            </p>
            <p>
              We&apos;ve sent a confirmation and the session details to your
              email.
            </p>
            <div className={styles.orderRef}>Order {orderRef}</div>
            <div className={styles.successActions}>
              <Link href={`/courses/${course.id}`} className="btn btn-secondary">
                Back to course
              </Link>
              <Link href="/courses" className="btn btn-primary">
                Browse more courses
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
          <i className="fa fa-angle-left"></i> Back to course
        </Link>

        <h1 className={styles.heading}>Checkout</h1>
        <p className={styles.subheading}>
          Complete your enrollment with a secure Algerian payment method.
        </p>

        <div className={styles.layout}>
          {/* Payment column */}
          <form onSubmit={handleSubmit}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Payment method</h2>
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
                    <span className={styles.methodName}>BaridiMob</span>
                    <span className={styles.methodDesc}>
                      Algérie Poste mobile payment (CCP / RIP)
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
                    <span className={styles.methodName}>CIB / Edahabia Card</span>
                    <span className={styles.methodDesc}>
                      Pay with your national interbank card
                    </span>
                  </span>
                </label>
              </div>

              {/* Method-specific fields */}
              {method === "baridimob" ? (
                <>
                  <div className={styles.fields}>
                    <div className={styles.field}>
                      <label htmlFor="ccp">CCP / RIP number</label>
                      <input
                        id="ccp"
                        type="text"
                        placeholder="00799999 0004567891 23"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="phone">Phone number</label>
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
                    <span>
                      After confirming, you&apos;ll receive a payment request in
                      your BaridiMob app. Approve it to complete your enrollment.
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.fields}>
                  <div className={styles.field}>
                    <label htmlFor="card">Card number</label>
                    <input
                      id="card"
                      type="text"
                      inputMode="numeric"
                      placeholder="6280 5811 1234 5678"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="holder">Cardholder name</label>
                    <input id="holder" type="text" placeholder="Full name" required />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label htmlFor="exp">Expiry</label>
                      <input id="exp" type="text" placeholder="MM / YY" required />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="cvv">CVV</label>
                      <input id="cvv" type="text" inputMode="numeric" placeholder="123" required />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary ${styles.payBtn}`}
                disabled={submitting}
              >
                {submitting ? (
                  "Processing..."
                ) : (
                  <>
                    Pay {formatDZD(option.price)}
                  </>
                )}
              </button>
              <p className={styles.secure}>
                <i className="fa fa-lock"></i> Payments are secure and processed
                in Algerian Dinar (DZD).
              </p>
            </div>
          </form>

          {/* Order summary */}
          <aside className={styles.summary}>
            <h3>Order summary</h3>
            <div className={styles.courseLine}>
              <div className={styles.courseThumb}>
                <CourseBanner subject={course.major} seed={course.id} />
              </div>
              <div>
                <div className={styles.cName}>{course.subject}</div>
                <div className={styles.cMeta}>
                  {course.tier} · with {teacher}
                </div>
                <span className={styles.optionPill}>
                  <i className={`fa ${option.icon}`}></i> {option.title}
                </span>
              </div>
            </div>
            <div className={styles.sumRow}>
              <span>{option.title}</span>
              <span>{formatDZD(option.price)}</span>
            </div>
            <div className={styles.sumRow}>
              <span>Platform fee</span>
              <span>0 DA</span>
            </div>
            <div className={styles.sumTotal}>
              <span className={styles.tLabel}>Total</span>
              <span className={styles.tValue}>{formatDZD(option.price)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
