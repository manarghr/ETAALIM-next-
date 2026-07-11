import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "E-Taalim - About Us",
};

const values = [
  {
    icon: "fa-eye",
    title: "Our Vision",
    text: "A world where quality education is accessible to everyone, everywhere — breaking down barriers of location, cost, and background.",
  },
  {
    icon: "fa-check-circle",
    title: "Commitment to Quality",
    text: "Courses designed by industry experts and continually updated so they stay relevant, effective, and genuinely useful.",
  },
  {
    icon: "fa-rocket",
    title: "Empowering Growth",
    text: "We give learners the resources, support, and community to take control of their education and achieve success on their own terms.",
  },
  {
    icon: "fa-lightbulb-o",
    title: "Innovative Learning",
    text: "Video lectures, quizzes, projects, and discussion forums — engaging formats that adapt to every learning style.",
  },
  {
    icon: "fa-users",
    title: "Learning Community",
    text: "A collaborative environment where learners connect, share ideas, and support each other alongside expert mentors.",
  },
  {
    icon: "fa-refresh",
    title: "Always Evolving",
    text: "We continuously improve our courses and platform based on learner feedback and the latest industry trends.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <PageHero
        eyebrowKey="pageHero.aboutEyebrow"
        titleKey="pageHero.aboutTitle"
        accentKey="pageHero.aboutAccent"
        subtitleKey="pageHero.aboutSubtitle"
        crumbKey="pageHero.aboutCrumb"
      />

      {/* Intro */}
      <section className={styles.intro}>
        <div className="container">
          <Reveal className={styles.introInner}>
            <span className={styles.eyebrow}>Welcome to E-Taalim</span>
            <h2>
              Learning that <span className={styles.accent}>meets you where you are</span>
            </h2>
            <p>
              E-Taalim is committed to delivering flexible, affordable, and
              high-quality learning experiences. With a wide range of courses
              taught by expert mentors, we empower learners to grow, explore new
              skills, and thrive in a personalized and accessible environment —
              a journey of knowledge, growth, and opportunity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className={styles.values}>
        <div className="container">
          <div className={styles.valuesGrid}>
            {values.map((v, i) => (
              <Reveal key={v.title} className={styles.valueCard} delay={i * 80}>
                <div className={styles.valueIcon}>
                  <i className={`fa ${v.icon}`}></i>
                </div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className={styles.quoteBand}>
        <div className="container">
          <Reveal className={styles.quoteInner}>
            <p>
              We prioritize learner satisfaction and continuously seek feedback
              to improve our offerings and enhance the learning experience.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className="container">
          <Reveal className={styles.finalInner}>
            <h2>Your journey starts here</h2>
            <p>Let&apos;s learn, grow, and achieve — together.</p>
            <div className={styles.finalActions}>
              <Link href="/courses" className="btn btn-primary">
                Explore Courses <i className="fa fa-arrow-right"></i>
              </Link>
              <Link href="/mentor-form" className="btn btn-secondary">
                Become a Mentor
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
