export interface Certificate {
  name: string;
  issuer: string;
  year: number;
}

export interface LessonVideo {
  title: string;
  duration: string;
  thumbnail: string;
}

// Education cycles a mentor can teach, mirroring the course tiers.
export type TeachTier = "Primary" | "Middle" | "High School" | "University";

/**
 * A teaching qualification. Each mentor belongs to ONE education cycle and is
 * qualified up to a HIGHEST year in it; that implies teaching every year below
 * it in the same cycle (a 5AP primary teacher can also teach 1AP–4AP; a 4AM
 * teacher covers 1AM–3AM), but never a different cycle.
 */
export interface Teaching {
  tier: TeachTier;
  /** highest Algerian year code (5AP, 4AM, 3AS, Master…) */
  top: string;
}

/** Year codes per cycle, youngest → oldest (same codes the course catalog uses). */
export const TEACH_YEARS: Record<TeachTier, string[]> = {
  Primary: ["1AP", "2AP", "3AP", "4AP", "5AP"],
  Middle: ["1AM", "2AM", "3AM", "4AM"],
  "High School": ["1AS", "2AS", "3AS"],
  University: ["Licence", "Master", "Doctorat"],
};

export interface Mentor {
  id: number;
  name: string;
  major: string;
  level: string;
  experience: number;
  skills: string;
  email: string;
  phone: string;
  profilePicture: string;
  /** short professional headline */
  title: string;
  /** full description shown on the profile */
  bio: string;
  /** one-line snippet shown on the listing card */
  shortBio: string;
  linkedin: string;
  certificates: Certificate[];
  achievements: string[];
  /** poster image for the course sneak-peek player */
  previewPoster: string;
  /** sneak-peek course video (sample) */
  previewVideo: string;
  /** recorded lesson videos */
  lessons: LessonVideo[];
  /** cycles + highest year the mentor is qualified to teach */
  teaching: Teaching[];
}

// A short, professional sample clip used as the "sneak peek" for every course.
const PREVIEW_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

const eduImgs = [
  "/images/courses.jpg",
  "/images/virtual-classroom-study-space.jpg",
  "/images/laptops-593296_1920.jpg",
  "/images/student-5224089_1280.jpg",
  "/images/medium-shot-kid-taking-notes.jpg",
  "/images/tutoring.jpg",
];

const durations = ["12:45", "09:30", "15:20", "07:10", "18:05", "11:40", "14:12", "08:55"];

function topicsForMajor(major: string): string[] {
  switch (major.toLowerCase()) {
    case "mathematics":
      return ["Algebra Foundations", "Geometry Essentials", "Intro to Calculus", "Statistics in Practice"];
    case "physics":
      return ["Newtonian Mechanics", "Thermodynamics Basics", "Waves & Optics", "Electromagnetism"];
    case "computer science":
      return ["Programming Fundamentals", "Building Your First App", "Working with Databases", "Deploying to the Cloud"];
    case "chemistry":
      return ["Atomic Structure", "Organic Reactions", "Lab Techniques", "Chemical Bonding"];
    case "biology":
      return ["Cell Biology", "Genetics 101", "Human Anatomy", "Ecology & Ecosystems"];
    case "english":
      return ["Everyday Conversation", "Grammar Deep-Dive", "Academic Writing", "IELTS Speaking Prep"];
    case "french":
      return ["Les Bases du Français", "Grammaire Essentielle", "Conversation Pratique", "Compréhension Écrite"];
    case "economics":
      return ["Microeconomics Basics", "Macroeconomics Overview", "Financial Markets", "Personal Finance"];
    case "history":
      return ["The Ancient World", "The Modern Era", "Historical Analysis", "Sources & Evidence"];
    default:
      return ["Introduction", "Core Concepts", "Advanced Topics", "Practical Applications"];
  }
}

function makeLessons(major: string, offset: number): LessonVideo[] {
  return topicsForMajor(major).map((topic, i) => ({
    title: topic,
    duration: durations[(offset + i) % durations.length],
    thumbnail: eduImgs[(offset + i) % eduImgs.length],
  }));
}

function linkedinSlug(name: string): string {
  return "https://www.linkedin.com/in/" + name.toLowerCase().replace(/\s+/g, "-");
}

export const mentors: Mentor[] = [
  {
    id: 1,
    name: "Amina Benali",
    major: "Mathematics",
    level: "Senior",
    experience: 8,
    skills: "Algebra, Calculus, Statistics, Geometry",
    email: "amina.benali@e-taalim.com",
    phone: "+213 55 12 34 56",
    profilePicture: "/images/mentor-default.jpg",
    title: "Senior Mathematics Instructor",
    bio: "Amina turns intimidating math into intuitive, step-by-step problem solving. With 8 years guiding students from algebra to advanced calculus, she focuses on building deep understanding rather than rote memorization.",
    shortBio: "Making math intuitive, one problem at a time.",
    linkedin: linkedinSlug("Amina Benali"),
    certificates: [
      { name: "M.Sc. in Applied Mathematics", issuer: "USTHB Algiers", year: 2016 },
      { name: "Teaching Online: Best Practices", issuer: "Coursera", year: 2020 },
      { name: "Data Analysis with Python", issuer: "IBM", year: 2021 },
    ],
    achievements: ["Mentored 1,400+ students", "Top-Rated Mentor 2023", "98% positive student reviews"],
    previewPoster: eduImgs[1],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Mathematics", 0),
    teaching: [{ tier: "High School", top: "3AS" }],
  },
  {
    id: 2,
    name: "Yacine Khelifi",
    major: "Physics",
    level: "Senior",
    experience: 10,
    skills: "Mechanics, Thermodynamics, Electromagnetism",
    email: "yacine.khelifi@e-taalim.com",
    phone: "+213 55 23 45 67",
    profilePicture: "/images/mentor-default.jpg",
    title: "Physics Mentor & Lab Specialist",
    bio: "Yacine brings physics to life with real-world demonstrations and clear intuition. From mechanics to electromagnetism, he helps students connect equations to the world around them.",
    shortBio: "Bringing physics to life with real-world intuition.",
    linkedin: linkedinSlug("Yacine Khelifi"),
    certificates: [
      { name: "Ph.D. in Theoretical Physics", issuer: "University of Algiers", year: 2014 },
      { name: "Advanced Instructional Design", issuer: "edX", year: 2019 },
      { name: "STEM Educator Certification", issuer: "Microsoft", year: 2021 },
    ],
    achievements: ["Published 3 physics workbooks", "Speaker at EdTech Summit 2022", "1,000+ hours of live sessions"],
    previewPoster: eduImgs[2],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Physics", 1),
    teaching: [{ tier: "Middle", top: "4AM" }],
  },
  {
    id: 3,
    name: "Sofia Mansouri",
    major: "Computer Science",
    level: "Expert",
    experience: 7,
    skills: "Python, Web Development, Databases, Algorithms",
    email: "sofia.mansouri@e-taalim.com",
    phone: "+213 55 34 56 78",
    profilePicture: "/images/mentor-default.jpg",
    title: "Full-Stack Developer & CS Mentor",
    bio: "Sofia is a software engineer turned educator who teaches programming the way it's actually used in industry. She guides beginners from their very first line of code to shipping real, deployable projects.",
    shortBio: "From first line of code to shipping real projects.",
    linkedin: linkedinSlug("Sofia Mansouri"),
    certificates: [
      { name: "M.Sc. in Computer Science", issuer: "ESI Algiers", year: 2017 },
      { name: "Google Professional Cloud Developer", issuer: "Google", year: 2022 },
      { name: "Meta Front-End Developer", issuer: "Coursera", year: 2021 },
    ],
    achievements: ["Built 20+ project-based courses", "Ex-Software Engineer", "Mentored 2,000+ aspiring developers"],
    previewPoster: eduImgs[2],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Computer Science", 2),
    teaching: [{ tier: "University", top: "Doctorat" }],
  },
  {
    id: 4,
    name: "Karim Bouaziz",
    major: "Chemistry",
    level: "Senior",
    experience: 12,
    skills: "Organic Chemistry, Biochemistry, Lab Techniques",
    email: "karim.bouaziz@e-taalim.com",
    phone: "+213 55 45 67 89",
    profilePicture: "/images/mentor-default.jpg",
    title: "Chemistry Mentor",
    bio: "Karim makes organic chemistry approachable through structured reasoning and memorable examples. His students consistently improve their exam performance and their confidence in the lab.",
    shortBio: "Organic chemistry made structured and approachable.",
    linkedin: linkedinSlug("Karim Bouaziz"),
    certificates: [
      { name: "Ph.D. in Organic Chemistry", issuer: "University of Oran", year: 2011 },
      { name: "Laboratory Safety & Management", issuer: "edX", year: 2018 },
      { name: "Blended Learning Certification", issuer: "Coursera", year: 2020 },
    ],
    achievements: ["12 years teaching experience", "Curriculum advisor", "Guided 900+ students to exam success"],
    previewPoster: eduImgs[0],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Chemistry", 3),
    teaching: [{ tier: "High School", top: "3AS" }],
  },
  {
    id: 5,
    name: "Lina Hadjar",
    major: "Biology",
    level: "Intermediate",
    experience: 6,
    skills: "Cell Biology, Genetics, Ecology",
    email: "lina.hadjar@e-taalim.com",
    phone: "+213 55 56 78 90",
    profilePicture: "/images/mentor-default.jpg",
    title: "Biology & Life Sciences Mentor",
    bio: "Lina connects biology concepts to everyday life, from cells to entire ecosystems. She creates a supportive space where curiosity leads the learning.",
    shortBio: "Where curiosity leads the learning.",
    linkedin: linkedinSlug("Lina Hadjar"),
    certificates: [
      { name: "M.Sc. in Molecular Biology", issuer: "University of Constantine", year: 2018 },
      { name: "Genetics & Evolution", issuer: "edX", year: 2020 },
      { name: "Effective Online Teaching", issuer: "Coursera", year: 2021 },
    ],
    achievements: ["Created 12 interactive modules", "Top-rated in Life Sciences", "800+ students mentored"],
    previewPoster: eduImgs[4],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Biology", 4),
    // qualified up to 3AM only — teaches 1AM–3AM but not the 4AM (BEM) year
    teaching: [{ tier: "Middle", top: "3AM" }],
  },
  {
    id: 6,
    name: "Omar Slimani",
    major: "English",
    level: "Senior",
    experience: 9,
    skills: "Grammar, Conversation, Writing, IELTS Prep",
    email: "omar.slimani@e-taalim.com",
    phone: "+213 55 67 89 01",
    profilePicture: "/images/mentor-default.jpg",
    title: "English Language & IELTS Mentor",
    bio: "Omar helps learners speak English with confidence, whether for everyday conversation or IELTS success. His lessons are practical, engaging, and results-driven.",
    shortBio: "Speak English with confidence.",
    linkedin: linkedinSlug("Omar Slimani"),
    certificates: [
      { name: "CELTA (English Language Teaching)", issuer: "Cambridge", year: 2015 },
      { name: "TEFL Advanced Certification", issuer: "edX", year: 2018 },
      { name: "IELTS Examiner Training", issuer: "British Council", year: 2020 },
    ],
    achievements: ["Helped 300+ students pass IELTS", "Average band improvement +1.5", "9 years teaching worldwide"],
    previewPoster: eduImgs[3],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("English", 5),
    teaching: [{ tier: "High School", top: "3AS" }],
  },
  {
    id: 7,
    name: "Nadia Cherif",
    major: "French",
    level: "Senior",
    experience: 11,
    skills: "Grammaire, Conversation, Littérature",
    email: "nadia.cherif@e-taalim.com",
    phone: "+213 55 78 90 12",
    profilePicture: "/images/mentor-default.jpg",
    title: "French Language Mentor",
    bio: "Nadia teaches French through immersion and real conversation, making grammar feel natural. Her patient approach helps learners of all levels progress quickly.",
    shortBio: "Learn French naturally, through real conversation.",
    linkedin: linkedinSlug("Nadia Cherif"),
    certificates: [
      { name: "Licence de Lettres Modernes", issuer: "Université d'Alger", year: 2012 },
      { name: "DAEFLE (Enseignement du FLE)", issuer: "Alliance Française", year: 2016 },
      { name: "Digital Pedagogy", issuer: "Coursera", year: 2021 },
    ],
    achievements: ["11 years teaching French", "Certified FLE instructor", "1,100+ students mentored"],
    previewPoster: eduImgs[5],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("French", 2),
    // primary teacher of 5AP — also covers the younger years (1AP–4AP)
    teaching: [{ tier: "Primary", top: "5AP" }],
  },
  {
    id: 8,
    name: "Riad Belkacem",
    major: "Economics",
    level: "Expert",
    experience: 13,
    skills: "Microeconomics, Macroeconomics, Finance",
    email: "riad.belkacem@e-taalim.com",
    phone: "+213 55 89 01 23",
    profilePicture: "/images/mentor-default.jpg",
    title: "Economics & Finance Mentor",
    bio: "Riad breaks down economics and finance into clear, real-world insights. From microeconomics to personal finance, he equips students with knowledge they can actually use.",
    shortBio: "Economics you can actually use.",
    linkedin: linkedinSlug("Riad Belkacem"),
    certificates: [
      { name: "M.Sc. in Economics", issuer: "HEC Alger", year: 2010 },
      { name: "Financial Markets", issuer: "Yale (Coursera)", year: 2019 },
      { name: "CFA Level I", issuer: "CFA Institute", year: 2016 },
    ],
    achievements: ["13 years in academia & industry", "Author of 2 finance guides", "Mentored 1,500+ students"],
    previewPoster: eduImgs[2],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("Economics", 3),
    teaching: [{ tier: "University", top: "Master" }],
  },
  {
    id: 9,
    name: "Sara Toumi",
    major: "History",
    level: "Intermediate",
    experience: 5,
    skills: "World History, Modern History, Research",
    email: "sara.toumi@e-taalim.com",
    phone: "+213 55 90 12 34",
    profilePicture: "/images/mentor-default.jpg",
    title: "History & Social Sciences Mentor",
    bio: "Sara makes history come alive with storytelling and critical analysis. She encourages students to think like historians and connect the past to the present.",
    shortBio: "Making history come alive through storytelling.",
    linkedin: linkedinSlug("Sara Toumi"),
    certificates: [
      { name: "M.A. in Modern History", issuer: "University of Algiers", year: 2019 },
      { name: "Historical Research Methods", issuer: "edX", year: 2021 },
      { name: "Engaging Online Learners", issuer: "Coursera", year: 2022 },
    ],
    achievements: ["Created 10 narrated history modules", "Top new mentor 2023", "600+ students guided"],
    previewPoster: eduImgs[4],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons("History", 5),
    // primary teacher qualified for 5AP — also covers 1AP–4AP
    teaching: [{ tier: "Primary", top: "5AP" }],
  },
];

export function getMentors(): Mentor[] {
  return mentors;
}

/** Every year code the mentor covers in a cycle: their top year and all below. */
export function mentorYearCodes(m: Mentor, tier: TeachTier): string[] {
  const q = m.teaching.find((te) => te.tier === tier);
  if (!q) return [];
  const order = TEACH_YEARS[tier];
  const idx = order.indexOf(q.top);
  return idx < 0 ? [] : order.slice(0, idx + 1);
}

export function mentorTeachesTier(m: Mentor, tier: TeachTier): boolean {
  return m.teaching.some((te) => te.tier === tier);
}

export function mentorTeachesYear(m: Mentor, tier: TeachTier, code: string): boolean {
  return mentorYearCodes(m, tier).includes(code);
}

export function getMentorById(id: number): Mentor | undefined {
  return mentors.find((m) => m.id === id);
}

export function getOtherMentorsInMajor(
  major: string,
  excludeId: number,
  limit = 3
): Mentor[] {
  return mentors
    .filter((m) => m.major === major && m.id !== excludeId)
    .slice(0, limit);
}

export function getMentorMajors(): string[] {
  return Array.from(new Set(mentors.map((m) => m.major))).sort();
}

export function filterMentors(opts: { search?: string; major?: string }): Mentor[] {
  const search = (opts.search ?? "").trim().toLowerCase();
  const major = opts.major ?? "";
  return mentors.filter((m) => {
    if (major !== "" && major !== "All" && m.major !== major) return false;
    if (
      search !== "" &&
      !m.name.toLowerCase().includes(search) &&
      !m.major.toLowerCase().includes(search) &&
      !m.skills.toLowerCase().includes(search) &&
      !m.title.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });
}
