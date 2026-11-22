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
 * A teaching qualification: one education cycle + the EXACT years the mentor
 * chose to teach in it (no forced coverage of younger years — a 3AS teacher
 * isn't assumed to teach 1AS unless they picked it).
 */
export interface Teaching {
  tier: TeachTier;
  /** the specific Algerian year codes they teach (e.g. ["1AS","3AS"]) */
  years: string[];
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

/** Compact builder for the additional showcase mentors below. */
function extra(
  id: number,
  name: string,
  major: string,
  tier: TeachTier,
  years: string[],
  level: string,
  experience: number,
  skills: string,
  title: string,
  bio: string,
  shortBio: string,
  certs: [string, string, number][],
  achievements: string[],
  phone: string
): Mentor {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".");
  return {
    id,
    name,
    major,
    level,
    experience,
    skills,
    email: `${slug}@e-taalim.com`,
    phone,
    profilePicture: "/images/mentor-default.jpg",
    title,
    bio,
    shortBio,
    linkedin: linkedinSlug(name),
    certificates: certs.map(([n, issuer, year]) => ({ name: n, issuer, year })),
    achievements,
    previewPoster: eduImgs[id % eduImgs.length],
    previewVideo: PREVIEW_VIDEO,
    lessons: makeLessons(major, id),
    teaching: [{ tier, years }],
  };
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
    teaching: [{ tier: "High School", years: ["1AS", "2AS", "3AS"] }],
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
    teaching: [{ tier: "Middle", years: ["1AM", "2AM", "3AM", "4AM"] }],
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
    teaching: [{ tier: "University", years: ["Licence", "Master", "Doctorat"] }],
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
    teaching: [{ tier: "High School", years: ["1AS", "2AS", "3AS"] }],
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
    teaching: [{ tier: "Middle", years: ["1AM", "2AM", "3AM"] }],
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
    teaching: [{ tier: "High School", years: ["1AS", "2AS", "3AS"] }],
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
    teaching: [{ tier: "Primary", years: ["1AP", "2AP", "3AP", "4AP", "5AP"] }],
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
    teaching: [{ tier: "University", years: ["Licence", "Master"] }],
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
    teaching: [{ tier: "Primary", years: ["1AP", "2AP", "3AP", "4AP", "5AP"] }],
  },

  // ===== Additional showcase mentors (ids 101+ so they never collide with
  // the public_id of a real registered mentor). Each teaches ONE cycle. =====

  // ---- Primary ----
  extra(101, "Fatima Zohra Ait Ahmed", "Arabic", "Primary", ["1AP", "2AP", "3AP", "4AP", "5AP"], "Senior", 14,
    "Reading, Writing, Grammar, Dictation",
    "Primary Arabic Teacher",
    "Fatima Zohra has taught Arabic in primary schools in Tizi Ouzou for fourteen years. She builds reading fluency with short daily texts and plenty of dictation practice.",
    "Reading fluency, one short text a day.",
    [["Licence in Arabic Language and Literature", "University of Tizi Ouzou", 2009], ["Primary Teaching Certificate", "ENS Bouzareah", 2010]],
    ["14 years in primary classrooms", "1,200+ students mentored", "98% positive student reviews"],
    "+213 66 41 27 90"),
  extra(102, "Meriem Boudiaf", "Mathematics", "Primary", ["3AP", "4AP", "5AP"], "Intermediate", 6,
    "Mental Math, Fractions, Problem Solving",
    "Primary Mathematics Teacher",
    "Meriem helps young learners stop counting on their fingers. Her lessons use everyday objects and quick games to make fractions and multiplication tables stick.",
    "Fractions and times tables without the tears.",
    [["Licence in Mathematics", "University of Batna", 2017], ["Primary Teaching Certificate", "ENS Constantine", 2018]],
    ["600+ students guided", "Top new mentor 2023", "Created 10 interactive modules"],
    "+213 77 82 15 43"),
  extra(103, "Hocine Larbi", "Mathematics", "Primary", ["1AP", "2AP", "3AP"], "Intermediate", 9,
    "Counting, Addition, Shapes, Measurement",
    "Early Years Mathematics Teacher",
    "Hocine specialises in the first three years of primary, when number sense is formed. Parents like his short weekly progress notes.",
    "Strong number sense from the very first year.",
    [["Licence in Mathematics", "University of Blida", 2014], ["Early Childhood Education", "Coursera", 2021]],
    ["9 years in primary classrooms", "800+ students mentored", "98% positive student reviews"],
    "+213 55 73 61 08"),
  extra(104, "Imene Saadi", "English", "Primary", ["3AP", "4AP", "5AP"], "Junior", 4,
    "Vocabulary, Phonics, Songs, Conversation",
    "Primary English Teacher",
    "Imene introduces English to children through songs, picture cards and short role plays. Her classes are lively and her pupils speak from the first lesson.",
    "First English words through songs and play.",
    [["Licence in English", "University of Oran 2", 2020], ["TEFL Certificate", "edX", 2021]],
    ["400+ students guided", "Top new mentor 2023", "Created 10 interactive modules"],
    "+213 66 19 52 37"),

  // ---- Middle ----
  extra(105, "Mehdi Rahmani", "Mathematics", "Middle", ["1AM", "2AM", "3AM", "4AM"], "Senior", 11,
    "Algebra, Geometry, BEM Preparation",
    "Middle School Mathematics Teacher",
    "Mehdi has prepared eleven cohorts for the BEM in Sétif. He works through past papers line by line so students recognise every type of question.",
    "BEM maths, one past paper at a time.",
    [["Master in Applied Mathematics", "University of Sétif", 2013], ["Teaching Online: Best Practices", "Coursera", 2020]],
    ["Guided 900+ students to exam success", "11 years teaching experience", "Top-Rated Mentor 2023"],
    "+213 77 26 84 19"),
  extra(106, "Asma Ferhat", "Arabic", "Middle", ["1AM", "2AM", "3AM", "4AM"], "Senior", 8,
    "Grammar, Composition, Text Analysis",
    "Middle School Arabic Teacher",
    "Asma teaches grammar through the texts students actually read in class. Her composition workshops help pupils organise their ideas before the BEM.",
    "Clear grammar, confident writing.",
    [["Master in Arabic Literature", "University of Algiers 2", 2015], ["Effective Online Teaching", "Coursera", 2021]],
    ["1,000+ students mentored", "Curriculum advisor", "98% positive student reviews"],
    "+213 55 91 40 62"),
  extra(107, "Walid Benyahia", "English", "Middle", ["1AM", "2AM", "3AM"], "Intermediate", 5,
    "Grammar, Reading, Speaking",
    "Middle School English Teacher",
    "Walid keeps English practical: every lesson ends with students using the new words in a short conversation. He teaches in Annaba and online.",
    "Speak a little more every lesson.",
    [["Licence in English", "University of Annaba", 2018], ["TEFL Certificate", "edX", 2019]],
    ["500+ students guided", "1,000+ hours of live sessions", "Top new mentor 2023"],
    "+213 66 58 23 71"),
  extra(108, "Kenza Moussaoui", "French", "Middle", ["2AM", "3AM", "4AM"], "Intermediate", 7,
    "Grammaire, Conjugaison, Expression écrite",
    "Middle School French Teacher",
    "Kenza focuses on conjugation and written expression, the two parts students fear most in the BEM. She corrects every exercise with clear written feedback.",
    "Conjugation and writing, made manageable.",
    [["Licence de Lettres Françaises", "Université de Béjaïa", 2016], ["DAEFLE (Enseignement du FLE)", "Alliance Française", 2019]],
    ["700+ students mentored", "Certified FLE instructor", "98% positive student reviews"],
    "+213 77 47 90 35"),

  // ---- High school ----
  extra(109, "Bilal Zerrouki", "Physics", "High School", ["2AS", "3AS"], "Senior", 10,
    "Mechanics, Electricity, Nuclear Physics, BAC Preparation",
    "High School Physics Teacher",
    "Bilal teaches physics for the scientific and technical math streams. His BAC revision sessions focus on method: read the question, set up the equation, check the units.",
    "Physics BAC prep built on method.",
    [["Master in Physics", "USTHB Algiers", 2013], ["STEM Educator Certification", "Microsoft", 2021]],
    ["Guided 900+ students to exam success", "1,000+ hours of live sessions", "Top-Rated Mentor 2023"],
    "+213 55 64 18 92"),
  extra(110, "Houda Mebarki", "History", "High School", ["1AS", "2AS", "3AS"], "Senior", 12,
    "History, Geography, Philosophy, Essay Writing",
    "History, Geography and Philosophy Teacher",
    "Houda teaches the literary streams in Constantine. She shows students how to structure an essay and how to use dates and documents as evidence.",
    "Essays with structure and evidence.",
    [["Master in Modern History", "University of Constantine", 2011], ["Historical Research Methods", "edX", 2020]],
    ["12 years teaching experience", "Curriculum advisor", "1,100+ students mentored"],
    "+213 66 30 75 48"),
  extra(111, "Samir Haddad", "Economics", "High School", ["2AS", "3AS"], "Senior", 9,
    "Accounting, Economics, Management, Law",
    "Management and Economics Teacher",
    "Samir teaches accounting and economics to the management stream. He brings real invoices and balance sheets into class so the numbers mean something.",
    "Accounting with real documents, not just theory.",
    [["Master in Accounting and Finance", "ESC Koléa", 2014], ["Financial Markets", "Yale (Coursera)", 2019]],
    ["Guided 900+ students to exam success", "Author of 2 finance guides", "Curriculum advisor"],
    "+213 77 15 39 66"),

  // ---- University ----
  extra(112, "Nassim Belaid", "Mathematics", "University", ["Licence", "Master"], "Expert", 13,
    "Analysis, Linear Algebra, Probability",
    "Lecturer in Mathematics",
    "Nassim lectures in analysis and linear algebra. His tutorials walk through proofs slowly so first-year students learn how to write them, not just read them.",
    "Learn to write proofs, not just read them.",
    [["Ph.D. in Mathematics", "USTHB Algiers", 2012], ["Advanced Instructional Design", "edX", 2019]],
    ["13 years in academia & industry", "Mentored 1,500+ students", "Curriculum advisor"],
    "+213 55 87 02 54"),
  extra(113, "Ryma Benmoussa", "Computer Science", "University", ["Licence", "Master"], "Expert", 8,
    "Java, Data Structures, Networks, Databases",
    "Software Engineer and CS Lecturer",
    "Ryma splits her time between a software company in Algiers and teaching. Her courses follow the Licence programme with weekly coding exercises.",
    "University CS with weekly hands-on code.",
    [["Master in Software Engineering", "ESI Algiers", 2016], ["Google Professional Cloud Developer", "Google", 2023]],
    ["Built 20+ project-based courses", "Ex-Software Engineer", "Mentored 2,000+ aspiring developers"],
    "+213 66 72 48 13"),
  extra(114, "Adel Guerroudj", "Physics", "University", ["Licence"], "Senior", 10,
    "Mechanics, Thermodynamics, Optics",
    "Lecturer in Physics",
    "Adel teaches first and second year physics for science and engineering students. He links each chapter to a short lab experiment students can follow at home.",
    "First-year physics with simple home experiments.",
    [["Ph.D. in Physics", "University of Oran", 2014], ["Blended Learning Certification", "Coursera", 2020]],
    ["12 years teaching experience", "Published 3 physics workbooks", "800+ students mentored"],
    "+213 77 93 26 01"),
  extra(115, "Selma Khodja", "English", "University", ["Licence", "Master"], "Senior", 9,
    "Academic Writing, IELTS Prep, Presentations",
    "Academic English Lecturer",
    "Selma helps university students write reports, give presentations and prepare for IELTS. Many of her students use her course before applying for a master's abroad.",
    "Academic English for reports, talks and IELTS.",
    [["Master in Applied Linguistics", "University of Algiers 2", 2015], ["IELTS Examiner Training", "British Council", 2020]],
    ["Helped 300+ students pass IELTS", "Average band improvement +1.5", "9 years teaching worldwide"],
    "+213 55 26 71 84"),
];

export function getMentors(): Mentor[] {
  return mentors;
}

/** The exact year codes the mentor teaches in a cycle (sorted youngest→oldest). */
export function mentorYearCodes(m: Mentor, tier: TeachTier): string[] {
  const q = m.teaching.find((te) => te.tier === tier);
  if (!q) return [];
  const order = TEACH_YEARS[tier];
  return [...q.years].sort((a, b) => order.indexOf(a) - order.indexOf(b));
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

export function filterMentors(
  opts: { search?: string; major?: string },
  list: Mentor[] = mentors
): Mentor[] {
  const search = (opts.search ?? "").trim().toLowerCase();
  const major = opts.major ?? "";
  return list.filter((m) => {
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
