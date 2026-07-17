"use client";

import { useState, FormEvent } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDZD } from "@/data/courses";
import styles from "./TopUpModal.module.css";

type Method = "baridimob" | "cib";

// The amounts offered inside the modal (the wallet chips open it pre-selected).
const AMOUNTS = [1000, 2000, 5000];

export default function TopUpModal({
  amount,
  onClose,
  onConfirm,
}: {
  /** preset the user tapped; null when the modal is closed */
  amount: number | null;
  onClose: () => void;
  /** called with the final amount once the mock payment "succeeds" */
  onConfirm: (amount: number) => void;
}) {
  const { t, locale } = useI18n();
  const [method, setMethod] = useState<Method>("baridimob");
  const [selected, setSelected] = useState(amount ?? AMOUNTS[0]);
  const [submitting, setSubmitting] = useState(false);

  if (amount === null) return null;

  const money = (n: number) => formatDZD(n, locale);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Payment is mocked until the backend is connected — the required fields
    // above still gate submission, so the wallet is only credited after the
    // user actually enters their payment details.
    setTimeout(() => {
      setSubmitting(false);
      onConfirm(selected);
    }, 1400);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("dash.topupTitle")}
      >
        <div className={styles.head}>
          <div>
            <h3>{t("dash.topupTitle")}</h3>
            <p>{t("dash.topupSub")}</p>
          </div>
          <button
            type="button"
            className={styles.closeX}
            onClick={onClose}
            aria-label={t("dash.cancel")}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <span className={styles.label}>{t("dash.topupAmount")}</span>
          <div className={styles.amountRow}>
            {AMOUNTS.map((a) => (
              <button
                type="button"
                key={a}
                className={`${styles.amountChip} ${
                  selected === a ? styles.amountChipActive : ""
                }`}
                onClick={() => setSelected(a)}
              >
                {money(a)}
              </button>
            ))}
          </div>

          {/* Payment method */}
          <span className={styles.label}>{t("checkout.methodTitle")}</span>
          <div className={styles.methodList}>
            <label
              className={`${styles.methodCard} ${
                method === "baridimob" ? styles.methodCardActive : ""
              }`}
            >
              <input
                type="radio"
                name="topup-method"
                checked={method === "baridimob"}
                onChange={() => setMethod("baridimob")}
                hidden
              />
              <span className={styles.methodRadio}></span>
              <span className={`${styles.methodLogo} ${styles.baridi}`}>
                <i className="fa fa-mobile"></i>
              </span>
              <span className={styles.methodInfo}>
                <span className={styles.methodName}>{t("checkout.baridiName")}</span>
                <span className={styles.methodDesc}>{t("checkout.baridiDesc")}</span>
              </span>
            </label>

            <label
              className={`${styles.methodCard} ${
                method === "cib" ? styles.methodCardActive : ""
              }`}
            >
              <input
                type="radio"
                name="topup-method"
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
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="tu-ccp">{t("checkout.ccpLabel")}</label>
                <input
                  id="tu-ccp"
                  type="text"
                  placeholder="00799999 0004567891 23"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="tu-phone">{t("checkout.phoneLabel")}</label>
                <input id="tu-phone" type="tel" placeholder="05 55 55 55 55" required />
              </div>
            </div>
          ) : (
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="tu-card">{t("checkout.cardLabel")}</label>
                <input
                  id="tu-card"
                  type="text"
                  inputMode="numeric"
                  placeholder="6280 5811 1234 5678"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="tu-holder">{t("checkout.holderLabel")}</label>
                <input
                  id="tu-holder"
                  type="text"
                  placeholder={t("checkout.holderPh")}
                  required
                />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="tu-exp">{t("checkout.expLabel")}</label>
                  <input id="tu-exp" type="text" placeholder="MM / YY" required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="tu-cvv">{t("checkout.cvvLabel")}</label>
                  <input
                    id="tu-cvv"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className={styles.payBtn} disabled={submitting}>
            {submitting
              ? t("checkout.processing")
              : t("checkout.pay", { amount: money(selected) })}
          </button>
          <p className={styles.secure}>
            <i className="fa fa-lock"></i> {t("checkout.secure")}
          </p>
        </form>
      </div>
    </div>
  );
}
