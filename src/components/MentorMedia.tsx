"use client";

import { useState } from "react";
import type { LessonVideo } from "@/data/mentors";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./MentorMedia.module.css";

interface MentorMediaProps {
  poster: string;
  video: string;
  lessons: LessonVideo[];
}

// Course sneak-peek player + a playlist of recorded lessons.
// -1 = the course preview; 0..n = a recorded lesson.
export default function MentorMedia({ poster, video, lessons }: MentorMediaProps) {
  const { t } = useI18n();
  const [active, setActive] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);

  const isPreview = active === -1;
  const currentPoster = isPreview ? poster : lessons[active].thumbnail;
  const currentTitle = isPreview
    ? t("mentorDetail.firstLook")
    : lessons[active].title;

  const select = (index: number) => {
    setActive(index);
    setPlaying(true);
  };

  return (
    <div className={styles.wrap}>
      {/* Player */}
      <div className={styles.player}>
        {playing ? (
          <video
            key={active}
            className={styles.video}
            src={video}
            poster={currentPoster}
            controls
            autoPlay
          />
        ) : (
          <>
            <img className={styles.poster} src={currentPoster} alt={currentTitle} />
            <div className={styles.overlay} onClick={() => setPlaying(true)}>
              <span className={styles.badge}>
                <i className="fa fa-play-circle"></i> {t("mentorDetail.sneakPeek")}
              </span>
              <div className={styles.overlayLabel}>
                <div className={styles.overlayKicker}>{t("mentorDetail.coursePreview")}</div>
                <div className={styles.overlayTitle}>{currentTitle}</div>
              </div>
            </div>
            <button
              className={styles.playBtn}
              onClick={() => setPlaying(true)}
              aria-label="Play preview"
            >
              <i className="fa fa-play"></i>
            </button>
          </>
        )}
      </div>

      {/* Recorded lessons */}
      <div className={styles.lessons}>
        <div className={styles.lessonsHead}>{t("mentorDetail.recordedLessons")}</div>
        {lessons.map((lesson, i) => (
          <button
            key={i}
            className={`${styles.lesson} ${active === i ? styles.lessonActive : ""}`}
            onClick={() => select(i)}
          >
            <div className={styles.lessonThumb}>
              <img src={lesson.thumbnail} alt="" />
              <i className="fa fa-play"></i>
            </div>
            <div className={styles.lessonInfo}>
              <div className={styles.lessonTitle}>{lesson.title}</div>
              <div className={styles.lessonMeta}>
                <i className="fa fa-clock-o"></i>
                {lesson.duration}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
