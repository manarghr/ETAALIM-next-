"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Course, localeTag } from "@/data/courses";
import {
  getCourseReviews,
  postReview,
  CourseReview,
} from "@/lib/courseReviews";
import styles from "./CourseReviews.module.css";

function Stars({
  value,
  size = 15,
}: {
  value: number;
  size?: number;
}) {
  return (
    <span className={styles.stars} style={{ fontSize: size }} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i
          key={n}
          className={`fa ${
            value >= n
              ? "fa-star"
              : value >= n - 0.5
              ? "fa-star-half-o"
              : "fa-star-o"
          }`}
        />
      ))}
    </span>
  );
}

export default function CourseReviews({
  course,
  enrolled,
}: {
  course: Course;
  enrolled: boolean;
}) {
  const { t, locale } = useI18n();

  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>([]);

  // Average + count are derived straight from the loaded reviews.
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  // Form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [posted, setPosted] = useState(false);

  const refresh = async () => {
    setReviews(await getCourseReviews(course.id));
  };

  // Load reviews from Supabase on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const submit = async () => {
    if (rating === 0) return;
    try {
      await postReview(course.id, rating, text.trim());
      setRating(0);
      setText("");
      setPosted(true);
      await refresh();
      setTimeout(() => setPosted(false), 3500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not post review");
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(localeTag(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const reviewText = (r: CourseReview) => r.text ?? "";

  return (
    <div>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.avgBox}>
          <span className={styles.avgNum}>{mounted ? avg.toFixed(1) : "—"}</span>
          <Stars value={mounted ? avg : 0} size={16} />
          <span className={styles.basedOn}>
            {mounted ? t("review.basedOn", { n: count }) : ""}
          </span>
        </div>
      </div>

      {/* Write a review */}
      {enrolled ? (
        <div className={styles.writeBox}>
          <h4 className={styles.writeTitle}>{t("review.write")}</h4>
          {posted && <div className={styles.posted}>{t("review.posted")}</div>}
          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>{t("review.yourRating")}</span>
            <span
              className={styles.starPicker}
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.starBtn}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  aria-label={`${n}`}
                >
                  <i
                    className={`fa ${
                      (hover || rating) >= n ? "fa-star" : "fa-star-o"
                    }`}
                  ></i>
                </button>
              ))}
            </span>
          </div>
          <textarea
            className={styles.textarea}
            placeholder={t("review.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="button"
            className={styles.submitBtn}
            onClick={submit}
            disabled={rating === 0}
          >
            {t("review.submit")}
          </button>
        </div>
      ) : (
        <p className={styles.enrolledOnly}>
          <i className="fa fa-info-circle"></i> {t("review.enrolledOnly")}
        </p>
      )}

      {/* Review list */}
      <div className={styles.list}>
        {mounted &&
          reviews.map((r) => (
            <div key={r.id} className={styles.review}>
              <div className={styles.reviewAvatar}>
                {r.author.trim().charAt(0).toUpperCase()}
              </div>
              <div className={styles.reviewBody}>
                <div className={styles.reviewTop}>
                  <b>{r.author}</b>
                  <span className={styles.reviewDate}>{fmtDate(r.date)}</span>
                </div>
                <Stars value={r.rating} size={13} />
                {reviewText(r) && (
                  <p className={styles.reviewText}>{reviewText(r)}</p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
