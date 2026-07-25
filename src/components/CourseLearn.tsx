"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { tr } from "@/data/localized";
import { Course } from "@/data/courses";
import { getLessons, Lesson } from "@/data/lessons";
import { getCompleted, setLessonDone, pctOf } from "@/lib/progress";
import styles from "./CourseLearn.module.css";

const TYPE_ICON: Record<Lesson["type"], string> = {
  video: "fa-play-circle",
  reading: "fa-file-text-o",
  quiz: "fa-question-circle",
};

export default function CourseLearn({
  course,
  enrolled,
}: {
  course: Course;
  enrolled: boolean;
}) {
  const { t, locale } = useI18n();
  const lessons = getLessons(course.id, course.major);

  // Progress is client-only (localStorage); gate first paint to avoid a
  // hydration mismatch, then reflect the real completed set.
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // Client-only progress read, deferred to after hydration so server and
  // client render the same initial (empty) state. setState-in-effect is
  // intentional here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    getCompleted(course.id).then(setDone);
  }, [course.id]);

  const isDone = (id: string) => done.includes(id);
  const total = lessons.length;
  const completedCount = mounted ? done.filter(Boolean).length : 0;
  const pct = mounted ? pctOf(completedCount, total) : 0;

  const lessonTitle = (l: Lesson) =>
    l.type === "quiz" ? t("learn.finalQuiz") : tr(l.topic, locale);
  const typeLabel = (l: Lesson) => t(`learn.${l.type}`);

  // A lesson is playable if enrolled, or it's the first one (free preview).
  const playable = (i: number) => enrolled || i === 0;

  const openLesson = (l: Lesson, i: number) => {
    if (!playable(i)) return;
    setOpenId(l.id);
  };

  const setDoneState = async (id: string, value: boolean) => {
    await setLessonDone(course.id, id, value);
    setDone((prev) =>
      value ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
    );
  };

  const openIndex = openId ? lessons.findIndex((l) => l.id === openId) : -1;
  const openLessonObj = openIndex >= 0 ? lessons[openIndex] : null;
  const nextLesson =
    openIndex >= 0 && openIndex < lessons.length - 1
      ? lessons[openIndex + 1]
      : null;

  const noteFor = (l: Lesson) =>
    l.type === "reading"
      ? t("learn.readingNote")
      : l.type === "quiz"
      ? t("learn.quizNote")
      : t("learn.playerNote");

  return (
    <div>
      {/* Progress header */}
      <div className={styles.progressHead}>
        <div className={styles.progressText}>
          <span className={styles.pct}>
            {t("learn.percentComplete", { pct })}
          </span>
          <span className={styles.count}>
            {t("learn.lessonsCount", { done: completedCount, total })}
          </span>
        </div>
        <div className={styles.track}>
          <span className={styles.bar} style={{ width: `${pct}%` }} />
        </div>
        {pct === 100 && (
          <div className={styles.complete}>{t("learn.courseComplete")}</div>
        )}
      </div>

      {!enrolled && (
        <div className={styles.lockedNote}>
          <span>
            <i className="fa fa-lock"></i> {t("learn.locked")}
          </span>
          <Link
            href={`/courses/${course.id}/checkout?mode=recorded`}
            className={styles.lockedCta}
          >
            {t("learn.lockedCta")}
          </Link>
        </div>
      )}

      {/* Lessons */}
      <ol className={styles.list}>
        {lessons.map((l, i) => {
          const locked = !playable(i);
          const complete = mounted && isDone(l.id);
          return (
            <li
              key={l.id}
              className={`${styles.row} ${complete ? styles.rowDone : ""} ${
                locked ? styles.rowLocked : ""
              }`}
              onClick={() => openLesson(l, i)}
            >
              <span className={styles.rowIcon}>
                <i
                  className={`fa ${
                    complete ? "fa-check-circle" : TYPE_ICON[l.type]
                  }`}
                ></i>
              </span>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{lessonTitle(l)}</span>
                <span className={styles.rowMeta}>
                  {typeLabel(l)} · {l.minutes} {t("learn.min")}
                </span>
              </span>
              {locked ? (
                <i className={`fa fa-lock ${styles.rowLock}`}></i>
              ) : !enrolled && i === 0 ? (
                <span className={styles.previewTag}>{t("learn.preview")}</span>
              ) : complete ? (
                <span className={styles.doneTag}>{t("learn.completed")}</span>
              ) : (
                <i className={`fa fa-play ${styles.rowPlay}`}></i>
              )}
            </li>
          );
        })}
      </ol>

      {/* Lesson viewer */}
      {openLessonObj && (
        <div className={styles.overlay} onClick={() => setOpenId(null)}>
          <div className={styles.viewer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.viewerHead}>
              <div>
                <span className={styles.viewerType}>
                  <i className={`fa ${TYPE_ICON[openLessonObj.type]}`}></i>{" "}
                  {typeLabel(openLessonObj)} · {openLessonObj.minutes}{" "}
                  {t("learn.min")}
                </span>
                <h3>{lessonTitle(openLessonObj)}</h3>
              </div>
              <button
                className={styles.viewerClose}
                onClick={() => setOpenId(null)}
                aria-label={t("learn.close")}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className={styles.stage}>
              <i className={`fa ${TYPE_ICON[openLessonObj.type]}`}></i>
              <p>{noteFor(openLessonObj)}</p>
            </div>

            <div className={styles.viewerActions}>
              <button
                className={`${styles.doneBtn} ${
                  isDone(openLessonObj.id) ? styles.doneBtnActive : ""
                }`}
                onClick={() =>
                  setDoneState(openLessonObj.id, !isDone(openLessonObj.id))
                }
              >
                <i className="fa fa-check"></i>{" "}
                {isDone(openLessonObj.id)
                  ? t("learn.completed")
                  : t("learn.markComplete")}
              </button>
              {nextLesson && (
                <button
                  className={styles.nextBtn}
                  onClick={() => {
                    // mark current complete and advance
                    setDoneState(openLessonObj.id, true);
                    setOpenId(nextLesson.id);
                  }}
                >
                  {t("learn.nextLesson")} <i className="fa fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
