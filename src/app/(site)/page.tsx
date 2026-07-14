"use client";

import Link from "next/link";
import Counter from "@/components/Counter";
import CourseBanner from "@/components/CourseBanner";
import Reveal from "@/components/Reveal";
import Faq from "@/components/Faq";
import { courses, mentorName, formatDZD } from "@/data/courses";
import { mentors, getMentorById } from "@/data/mentors";
import {
  cssVars,
  colorVar,
  accentByIndex,
  categoryAccent,
  brightAccents,
} from "@/lib/theme";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./page.module.css";

const featureIcons = [
  "/images/livre.png",
  "/images/mentor.png",
  "/images/tutoriels-videos.png",
  "/images/interactif.png",
  "/images/communaute.png",
  "/images/prix-le-plus-bas.png",
];

const subjectDefs = [
  { name: "Mathematics", icon: "fa-calculator" },
  { name: "Physics", icon: "fa-rocket" },
  { name: "Computer Science", icon: "fa-code" },
  { name: "Chemistry", icon: "fa-flask" },
  { name: "Biology", icon: "fa-leaf" },
  { name: "English", icon: "fa-language" },
  { name: "Economics", icon: "fa-line-chart" },
  { name: "History", icon: "fa-university" },
];

const featuredCourses = courses.slice(0, 4);
const featuredMentors = mentors.slice(0, 5);
const heroAvatars = mentors.slice(0, 4).map((m) => m.profilePicture);

export default function Home() {
  const { t } = useI18n();

  const features = [1, 2, 3, 4, 5, 6].map((n, i) => ({
    icon: featureIcons[i],
    title: t(`features.f${n}t`),
    text: t(`features.f${n}d`),
  }));

  const testimonials = [
    { text: t("testimonials.q1"), name: "Sarah A.", role: t("testimonials.r1") },
    { text: t("testimonials.q2"), name: "Mohamed B.", role: t("testimonials.r2") },
    { text: t("testimonials.q3"), name: "Amina K.", role: t("testimonials.r3") },
  ];

  const faqItems = [1, 2, 3, 4, 5].map((n) => ({
    question: t(`faq.q${n}`),
    answer: t(`faq.a${n}`),
  }));

  return (
    <div className={styles.home}>
      {/* ===================== HERO ===================== */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.heroBadge}>
                <span className={styles.dot}></span>
                {t("hero.badge")}
              </span>
              <h1 className={styles.heroTitle}>
                {t("hero.title1")}{" "}
                <span className={styles.accent}>{t("hero.title2")}</span>
              </h1>
              <p className={styles.heroSubtitle}>{t("hero.subtitle")}</p>
              <div className={styles.heroCtas}>
                <Link href="/courses" className={styles.btnPrimary}>
                  {t("hero.explore")} <i className="fa fa-arrow-right"></i>
                </Link>
                <Link href="/mentor-form" className={styles.btnGhost}>
                  <i className="fa fa-graduation-cap"></i> {t("hero.joinMentor")}
                </Link>
              </div>
              <div className={styles.heroTrust}>
                <div className={styles.avatars}>
                  {heroAvatars.map((src, i) => (
                    <span key={i} style={{ backgroundImage: `url(${src})` }}></span>
                  ))}
                </div>
                <div className={styles.trustText}>
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className="fa fa-star"></i>
                    ))}
                  </div>
                  <b>4.9/5</b> {t("hero.ratingText")}
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroFrame}>
                <img
                  src="/images/online-learning.svg"
                  alt="Online learning illustration"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAND ===================== */}
      <section className={styles.statsBand}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Counter target={120} suffix="+" className={styles.statNumber} style={colorVar(brightAccents[0])} />
              <span className={styles.statText}>{t("stats.courses")}</span>
            </div>
            <div className={styles.statItem}>
              <Counter target={80} suffix="+" className={styles.statNumber} style={colorVar(brightAccents[1])} />
              <span className={styles.statText}>{t("stats.mentors")}</span>
            </div>
            <div className={styles.statItem}>
              <Counter target={10000} suffix="+" className={styles.statNumber} style={colorVar(brightAccents[2])} />
              <span className={styles.statText}>{t("stats.students")}</span>
            </div>
            <div className={styles.statItem}>
              <Counter target={98} suffix="%" className={styles.statNumber} style={colorVar(brightAccents[3])} />
              <span className={styles.statText}>{t("stats.satisfaction")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className={`${styles.section} ${styles.features}`}>
        <div className="container">
          <div className={styles.featuresFrame}>
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("features.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("features.title1")}{" "}
              <span className={styles.accent}>{t("features.title2")}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t("features.subtitle")}</p>
          </Reveal>

          <div className={styles.featureGrid}>
            {features.map((f, i) => (
              <Reveal key={i} className={styles.featureCard} delay={i * 80} style={cssVars(accentByIndex(i))}>
                <div className={styles.featureIcon}>
                  <img src={f.icon} alt="" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </Reveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ===================== EXPLORE SUBJECTS ===================== */}
      <section className={`${styles.section} ${styles.subjects}`}>
        <div className="container">
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("subjects.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("subjects.title1")}{" "}
              <span className={styles.accent}>{t("subjects.title2")}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t("subjects.subtitle")}</p>
          </Reveal>

          <Reveal className={styles.subjectsGrid}>
            {subjectDefs.map((s) => (
              <Link
                key={s.name}
                href={`/courses?major=${encodeURIComponent(s.name)}`}
                className={styles.subjectTile}
                style={cssVars(categoryAccent(s.name))}
              >
                <div className={styles.subjectIcon}>
                  <i className={`fa ${s.icon}`}></i>
                </div>
                <div className={styles.subjectName}>{t(`subjects.${s.name}`)}</div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ===================== FEATURED COURSES ===================== */}
      <section className={`${styles.section} ${styles.courses}`}>
        <div className="container">
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("courses.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("courses.title1")}{" "}
              <span className={styles.accent}>{t("courses.title2")}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t("courses.subtitle")}</p>
          </Reveal>

          <div className={styles.courseGrid}>
            {featuredCourses.map((course, i) => {
              const mentor = getMentorById(course.mentorId);
              return (
                <Reveal key={course.id} className={styles.courseCard} delay={i * 90}>
                  <div className={styles.courseThumb}>
                    <CourseBanner subject={course.major} seed={course.id} />
                    <span className={styles.courseChip} style={cssVars(categoryAccent(course.major))}>
                      {course.major}
                    </span>
                    <span className={styles.coursePriceTag}>{formatDZD(course.price)}</span>
                  </div>
                  <div className={styles.courseBody}>
                    <h3>{course.subject}</h3>
                    <div className={styles.courseMentor}>
                      {mentor && <img src={mentor.profilePicture} alt={mentor.name} />}
                      {t("courses.by")} {mentorName(course.mentorId)}
                    </div>
                    <div className={styles.courseMeta}>
                      <span>
                        <i className="fa fa-signal"></i>
                        {course.level}
                      </span>
                      <span>
                        <i className="fa fa-star"></i>
                        4.8
                      </span>
                    </div>
                    <Link href={`/courses/${course.id}`} className={styles.courseLink}>
                      {t("courses.viewCourse")} <i className="fa fa-arrow-right"></i>
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className={styles.sectionCta}>
            <Link href="/courses" className={styles.btnPrimary}>
              {t("courses.browseAll")} <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FEATURED MENTORS ===================== */}
      <section className={`${styles.section} ${styles.mentors}`}>
        <div className="container">
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("mentorsSec.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("mentorsSec.title1")}{" "}
              <span className={styles.accent}>{t("mentorsSec.title2")}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t("mentorsSec.subtitle")}</p>
          </Reveal>

          <div className={styles.mentorRow}>
            {featuredMentors.map((m, i) => (
              <Reveal key={m.id} className={styles.mentorCard} delay={i * 70}>
                <Link href={`/mentors/${m.id}`}>
                  <div className={styles.mentorAvatar}>
                    <img src={m.profilePicture} alt={m.name} />
                  </div>
                  <h4>{m.name}</h4>
                  <span>{m.major}</span>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className={styles.sectionCta}>
            <Link href="/mentors" className={styles.btnGhost}>
              {t("mentorsSec.viewAll")} <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className={`${styles.section} ${styles.testimonials}`}>
        <div className="container">
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("testimonials.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("testimonials.title1")}{" "}
              <span className={styles.accent}>{t("testimonials.title2")}</span>
            </h2>
          </Reveal>

          <div className={styles.testimonialGrid}>
            {testimonials.map((tst, i) => (
              <Reveal key={i} className={styles.testimonialCard} delay={i * 90} style={cssVars(accentByIndex(i + 3))}>
                <span className={styles.quoteMark}>&ldquo;</span>
                <p className={styles.testimonialText}>{tst.text}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>{tst.name.charAt(0)}</div>
                  <div>
                    <div className={styles.authorName}>{tst.name}</div>
                    <div className={styles.authorRole}>{tst.role}</div>
                  </div>
                  <div className={styles.testimonialStars}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <i key={s} className="fa fa-star"></i>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== MENTOR CTA BAND ===================== */}
      <section className={styles.ctaBand}>
        <div className="container">
          <Reveal className={styles.ctaInner}>
            <div>
              <h2>{t("cta.title")}</h2>
              <p>{t("cta.text")}</p>
            </div>
            <div className={styles.ctaActions}>
              <div className={styles.ctaBenefits}>
                <div>
                  <i className="fa fa-check-circle"></i> {t("cta.b1")}
                </div>
                <div>
                  <i className="fa fa-check-circle"></i> {t("cta.b2")}
                </div>
                <div>
                  <i className="fa fa-check-circle"></i> {t("cta.b3")}
                </div>
              </div>
              <Link href="/mentor-form" className={styles.btnPrimary}>
                {t("cta.apply")} <i className="fa fa-arrow-right"></i>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className={`${styles.section} ${styles.faq}`}>
        <div className="container">
          <Reveal className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("faq.eyebrow")}</span>
            <h2 className={styles.sectionTitle}>
              {t("faq.title1")}{" "}
              <span className={styles.accent}>{t("faq.title2")}</span>
            </h2>
            <p className={styles.sectionSubtitle}>{t("faq.subtitle")}</p>
          </Reveal>

          <div className={styles.faqContainer}>
            <Faq
              items={faqItems}
              classes={{
                item: styles.faqItem,
                itemActive: styles.faqItemActive,
                question: styles.faqQuestion,
                toggle: styles.faqToggle,
                answer: styles.faqAnswer,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
