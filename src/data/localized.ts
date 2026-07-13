// Localized content layer.
//
// The course/mentor data files stay in English (the "source of truth"). This
// module maps every user-facing English string to French + Arabic so the
// listing/detail pages can render in the platform's active language.
//
// Rule for people & titles (per product decision): in Arabic we KEEP the
// English name/title and add the Arabic beside it, e.g. "Amina Benali (أمينة بن علي)".
// Everything else (subjects, bios, skills, achievements, topics) is fully translated.

import { Locale } from "@/i18n/translations";

type Tr = { fr: string; ar: string };

// One flat dictionary: English phrase -> { fr, ar }.
// Grouped by comments only; lookup is by exact English string.
const DICT: Record<string, Tr> = {
  // ---- Majors / categories ----
  "Mathematics": { fr: "Mathématiques", ar: "الرياضيات" },
  "Physics": { fr: "Physique", ar: "الفيزياء" },
  "Computer Science": { fr: "Informatique", ar: "علوم الحاسوب" },
  "Chemistry": { fr: "Chimie", ar: "الكيمياء" },
  "Biology": { fr: "Biologie", ar: "الأحياء" },
  "English": { fr: "Anglais", ar: "اللغة الإنجليزية" },
  "French": { fr: "Français", ar: "اللغة الفرنسية" },
  "Arabic": { fr: "Arabe", ar: "اللغة العربية" },
  "Economics": { fr: "Économie", ar: "الاقتصاد" },
  "History": { fr: "Histoire", ar: "التاريخ" },

  // ---- Levels ----
  "Beginner": { fr: "Débutant", ar: "مبتدئ" },
  "Intermediate": { fr: "Intermédiaire", ar: "متوسط" },
  "Advanced": { fr: "Avancé", ar: "متقدم" },
  "Senior": { fr: "Expérimenté", ar: "خبير" },
  "Expert": { fr: "Expert", ar: "خبير متخصّص" },

  // ---- Tiers ----
  "Primary": { fr: "Primaire", ar: "الابتدائي" },
  "Middle": { fr: "Collège", ar: "المتوسط" },
  "High School": { fr: "Lycée", ar: "الثانوي" },
  "University": { fr: "Université", ar: "الجامعة" },

  // ---- Status ----
  "Available": { fr: "Disponible", ar: "متاح" },
  "Upcoming": { fr: "À venir", ar: "قريباً" },

  // ---- Course subjects ----
  "Arabic Language": { fr: "Langue arabe", ar: "اللغة العربية" },
  "Primary Mathematics": { fr: "Mathématiques du primaire", ar: "رياضيات الابتدائي" },
  "Beginner French": { fr: "Français débutant", ar: "الفرنسية للمبتدئين" },
  "Middle-School Mathematics": { fr: "Mathématiques du collège", ar: "رياضيات المتوسط" },
  "General Science (BEM)": { fr: "Sciences générales (BEM)", ar: "العلوم العامة (BEM)" },
  "English for Middle School": { fr: "Anglais pour le collège", ar: "الإنجليزية للمتوسط" },
  "Algebra & Analysis (BAC)": { fr: "Algèbre et analyse (BAC)", ar: "الجبر والتحليل (BAC)" },
  "Classical Mechanics": { fr: "Mécanique classique", ar: "الميكانيكا الكلاسيكية" },
  "Organic Chemistry (BAC)": { fr: "Chimie organique (BAC)", ar: "الكيمياء العضوية (BAC)" },
  "Cell Biology (BAC)": { fr: "Biologie cellulaire (BAC)", ar: "بيولوجيا الخلية (BAC)" },
  "Calculus I": { fr: "Analyse I", ar: "التفاضل والتكامل I" },
  "Intro to Python": { fr: "Introduction à Python", ar: "مقدمة في بايثون" },
  "Web Development Basics": { fr: "Bases du développement web", ar: "أساسيات تطوير الويب" },
  "Principles of Economics": { fr: "Principes d'économie", ar: "مبادئ الاقتصاد" },

  // ---- Algerian-curriculum subjects ----
  "French Language": { fr: "Langue française", ar: "اللغة الفرنسية" },
  "Natural Sciences": { fr: "Sciences naturelles", ar: "العلوم الطبيعية" },
  "History & Geography": { fr: "Histoire-Géographie", ar: "التاريخ والجغرافيا" },
  "Technology": { fr: "Technologie", ar: "التكنولوجيا" },
  "Economics & Management": { fr: "Économie et gestion", ar: "الاقتصاد والتسيير" },
  "Accounting": { fr: "Comptabilité", ar: "المحاسبة" },
  "Philosophy": { fr: "Philosophie", ar: "الفلسفة" },
  "Foreign Languages": { fr: "Langues étrangères", ar: "اللغات الأجنبية" },

  // ---- Mentor professional titles ----
  "Senior Mathematics Instructor": { fr: "Enseignante senior de mathématiques", ar: "مدرّسة رياضيات أولى" },
  "Physics Mentor & Lab Specialist": { fr: "Mentor en physique et spécialiste de laboratoire", ar: "مُوجّه فيزياء وأخصائي مختبر" },
  "Full-Stack Developer & CS Mentor": { fr: "Développeuse full-stack et mentor en informatique", ar: "مطوّرة full-stack ومُوجّهة علوم حاسوب" },
  "Chemistry Mentor": { fr: "Mentor en chimie", ar: "مُوجّه كيمياء" },
  "Biology & Life Sciences Mentor": { fr: "Mentor en biologie et sciences de la vie", ar: "مُوجّهة أحياء وعلوم الحياة" },
  "English Language & IELTS Mentor": { fr: "Mentor d'anglais et préparation IELTS", ar: "مُوجّه لغة إنجليزية وتحضير IELTS" },
  "French Language Mentor": { fr: "Mentor de langue française", ar: "مُوجّهة لغة فرنسية" },
  "Economics & Finance Mentor": { fr: "Mentor en économie et finance", ar: "مُوجّه اقتصاد ومالية" },
  "History & Social Sciences Mentor": { fr: "Mentor en histoire et sciences sociales", ar: "مُوجّهة تاريخ وعلوم اجتماعية" },

  // ---- Mentor short bios (listing card) ----
  "Making math intuitive, one problem at a time.": { fr: "Rendre les maths intuitives, un problème à la fois.", ar: "أجعل الرياضيات بديهية، مسألةً تلو الأخرى." },
  "Bringing physics to life with real-world intuition.": { fr: "Donner vie à la physique avec une intuition du monde réel.", ar: "أُحيي الفيزياء بحدسٍ مستمدٍّ من الواقع." },
  "From first line of code to shipping real projects.": { fr: "De la première ligne de code à des projets concrets.", ar: "من أول سطرٍ برمجي إلى إطلاق مشاريع حقيقية." },
  "Organic chemistry made structured and approachable.": { fr: "La chimie organique rendue structurée et accessible.", ar: "الكيمياء العضوية بأسلوبٍ منظّم وميسّر." },
  "Where curiosity leads the learning.": { fr: "Là où la curiosité guide l'apprentissage.", ar: "حيث يقود الفضولُ التعلّم." },
  "Speak English with confidence.": { fr: "Parlez anglais avec confiance.", ar: "تحدّث الإنجليزية بثقة." },
  "Learn French naturally, through real conversation.": { fr: "Apprenez le français naturellement, par la conversation.", ar: "تعلّم الفرنسية بشكلٍ طبيعي عبر المحادثة الحقيقية." },
  "Economics you can actually use.": { fr: "Une économie que vous pouvez réellement utiliser.", ar: "اقتصادٌ يمكنك تطبيقه فعلاً." },
  "Making history come alive through storytelling.": { fr: "Faire revivre l'histoire par le récit.", ar: "أُحيي التاريخ من خلال سرد القصص." },

  // ---- Mentor full bios (profile) ----
  "Amina turns intimidating math into intuitive, step-by-step problem solving. With 8 years guiding students from algebra to advanced calculus, she focuses on building deep understanding rather than rote memorization.": {
    fr: "Amina transforme des mathématiques intimidantes en une résolution de problèmes intuitive, étape par étape. Avec 8 ans d'accompagnement d'élèves, de l'algèbre à l'analyse avancée, elle privilégie une compréhension profonde plutôt que la mémorisation.",
    ar: "تحوّل أمينة الرياضياتِ المخيفة إلى حلٍّ بديهيٍّ للمسائل خطوةً بخطوة. وبفضل 8 سنوات من مرافقة الطلاب من الجبر إلى التفاضل والتكامل المتقدّم، تركّز على بناء فهمٍ عميق بدل الحفظ الآلي.",
  },
  "Yacine brings physics to life with real-world demonstrations and clear intuition. From mechanics to electromagnetism, he helps students connect equations to the world around them.": {
    fr: "Yacine donne vie à la physique par des démonstrations concrètes et une intuition claire. De la mécanique à l'électromagnétisme, il aide les élèves à relier les équations au monde qui les entoure.",
    ar: "يُحيي ياسين الفيزياءَ عبر عروضٍ من الواقع وحدسٍ واضح. ومن الميكانيكا إلى الكهرومغناطيسية، يساعد الطلاب على ربط المعادلات بالعالم من حولهم.",
  },
  "Sofia is a software engineer turned educator who teaches programming the way it's actually used in industry. She guides beginners from their very first line of code to shipping real, deployable projects.": {
    fr: "Sofia est ingénieure logicielle devenue formatrice, qui enseigne la programmation telle qu'elle est réellement utilisée en entreprise. Elle accompagne les débutants de leur toute première ligne de code jusqu'à des projets déployables.",
    ar: "صوفيا مهندسة برمجيات تحوّلت إلى معلّمة، تُدرّس البرمجة كما تُستخدَم فعلاً في القطاع. ترافق المبتدئين من أول سطرٍ برمجي حتى إطلاق مشاريع حقيقية قابلة للنشر.",
  },
  "Karim makes organic chemistry approachable through structured reasoning and memorable examples. His students consistently improve their exam performance and their confidence in the lab.": {
    fr: "Karim rend la chimie organique accessible grâce à un raisonnement structuré et des exemples mémorables. Ses élèves améliorent constamment leurs résultats aux examens et leur confiance en laboratoire.",
    ar: "يجعل كريم الكيمياءَ العضوية ميسّرة عبر تفكيرٍ منظّم وأمثلةٍ لا تُنسى. ويُحسّن طلابه باستمرار أداءهم في الامتحانات وثقتهم في المختبر.",
  },
  "Lina connects biology concepts to everyday life, from cells to entire ecosystems. She creates a supportive space where curiosity leads the learning.": {
    fr: "Lina relie les concepts de biologie à la vie quotidienne, des cellules aux écosystèmes entiers. Elle crée un espace bienveillant où la curiosité guide l'apprentissage.",
    ar: "تربط لينا مفاهيمَ الأحياء بالحياة اليومية، من الخلايا إلى النظم البيئية بأكملها. وتُهيّئ بيئةً داعمة يقود فيها الفضولُ التعلّم.",
  },
  "Omar helps learners speak English with confidence, whether for everyday conversation or IELTS success. His lessons are practical, engaging, and results-driven.": {
    fr: "Omar aide les apprenants à parler anglais avec confiance, que ce soit pour la conversation quotidienne ou la réussite à l'IELTS. Ses cours sont pratiques, captivants et axés sur les résultats.",
    ar: "يساعد عمر المتعلّمين على التحدّث بالإنجليزية بثقة، سواء للمحادثة اليومية أو للنجاح في IELTS. ودروسه عملية وشيّقة وموجّهة نحو النتائج.",
  },
  "Nadia teaches French through immersion and real conversation, making grammar feel natural. Her patient approach helps learners of all levels progress quickly.": {
    fr: "Nadia enseigne le français par l'immersion et la conversation réelle, rendant la grammaire naturelle. Son approche patiente aide les apprenants de tous niveaux à progresser rapidement.",
    ar: "تُدرّس نادية الفرنسية عبر الانغماس والمحادثة الحقيقية، فتجعل القواعد تبدو طبيعية. ويساعد أسلوبها الصبور المتعلّمين من جميع المستويات على التقدّم بسرعة.",
  },
  "Riad breaks down economics and finance into clear, real-world insights. From microeconomics to personal finance, he equips students with knowledge they can actually use.": {
    fr: "Riad décompose l'économie et la finance en idées claires et concrètes. De la microéconomie aux finances personnelles, il dote les étudiants de connaissances réellement utilisables.",
    ar: "يُبسّط رياض الاقتصادَ والمالية إلى أفكارٍ واضحة من الواقع. ومن الاقتصاد الجزئي إلى المالية الشخصية، يزوّد الطلاب بمعارف يمكنهم تطبيقها فعلاً.",
  },
  "Sara makes history come alive with storytelling and critical analysis. She encourages students to think like historians and connect the past to the present.": {
    fr: "Sara fait revivre l'histoire par le récit et l'analyse critique. Elle encourage les élèves à penser comme des historiens et à relier le passé au présent.",
    ar: "تُحيي سارة التاريخَ عبر سرد القصص والتحليل النقدي. وتشجّع الطلاب على التفكير كالمؤرّخين وربط الماضي بالحاضر.",
  },

  // ---- Skills (comma-split tokens) ----
  "Algebra": { fr: "Algèbre", ar: "الجبر" },
  "Calculus": { fr: "Analyse", ar: "التفاضل والتكامل" },
  "Statistics": { fr: "Statistiques", ar: "الإحصاء" },
  "Geometry": { fr: "Géométrie", ar: "الهندسة" },
  "Mechanics": { fr: "Mécanique", ar: "الميكانيكا" },
  "Thermodynamics": { fr: "Thermodynamique", ar: "الديناميكا الحرارية" },
  "Electromagnetism": { fr: "Électromagnétisme", ar: "الكهرومغناطيسية" },
  "Python": { fr: "Python", ar: "بايثون" },
  "Web Development": { fr: "Développement web", ar: "تطوير الويب" },
  "Databases": { fr: "Bases de données", ar: "قواعد البيانات" },
  "Algorithms": { fr: "Algorithmes", ar: "الخوارزميات" },
  "Organic Chemistry": { fr: "Chimie organique", ar: "الكيمياء العضوية" },
  "Biochemistry": { fr: "Biochimie", ar: "الكيمياء الحيوية" },
  "Lab Techniques": { fr: "Techniques de laboratoire", ar: "تقنيات المختبر" },
  "Cell Biology": { fr: "Biologie cellulaire", ar: "بيولوجيا الخلية" },
  "Genetics": { fr: "Génétique", ar: "علم الوراثة" },
  "Ecology": { fr: "Écologie", ar: "علم البيئة" },
  "Grammar": { fr: "Grammaire", ar: "القواعد" },
  "Conversation": { fr: "Conversation", ar: "المحادثة" },
  "Writing": { fr: "Expression écrite", ar: "الكتابة" },
  "IELTS Prep": { fr: "Préparation IELTS", ar: "تحضير IELTS" },
  "Grammaire": { fr: "Grammaire", ar: "القواعد" },
  "Littérature": { fr: "Littérature", ar: "الأدب" },
  "Microeconomics": { fr: "Microéconomie", ar: "الاقتصاد الجزئي" },
  "Macroeconomics": { fr: "Macroéconomie", ar: "الاقتصاد الكلي" },
  "Finance": { fr: "Finance", ar: "المالية" },
  "World History": { fr: "Histoire mondiale", ar: "تاريخ العالم" },
  "Modern History": { fr: "Histoire moderne", ar: "التاريخ الحديث" },
  "Research": { fr: "Recherche", ar: "البحث" },

  // ---- Achievements ----
  "Mentored 1,400+ students": { fr: "Plus de 1 400 élèves accompagnés", ar: "رافقت أكثر من 1400 طالب" },
  "Top-Rated Mentor 2023": { fr: "Mentor la mieux notée 2023", ar: "أفضل مُوجّهة تقييماً 2023" },
  "98% positive student reviews": { fr: "98 % d'avis positifs des élèves", ar: "98% تقييمات إيجابية من الطلاب" },
  "Published 3 physics workbooks": { fr: "Auteur de 3 cahiers de physique", ar: "نشر 3 كتب تمارين في الفيزياء" },
  "Speaker at EdTech Summit 2022": { fr: "Intervenant au EdTech Summit 2022", ar: "متحدّث في قمة EdTech 2022" },
  "1,000+ hours of live sessions": { fr: "Plus de 1 000 heures de sessions en direct", ar: "أكثر من 1000 ساعة من الجلسات المباشرة" },
  "Built 20+ project-based courses": { fr: "Plus de 20 cours par projets créés", ar: "أنشأت أكثر من 20 دورة قائمة على المشاريع" },
  "Ex-Software Engineer": { fr: "Ancienne ingénieure logicielle", ar: "مهندسة برمجيات سابقة" },
  "Mentored 2,000+ aspiring developers": { fr: "Plus de 2 000 développeurs en herbe accompagnés", ar: "رافقت أكثر من 2000 مطوّر طموح" },
  "12 years teaching experience": { fr: "12 ans d'expérience d'enseignement", ar: "12 عاماً من الخبرة في التدريس" },
  "Curriculum advisor": { fr: "Conseiller pédagogique", ar: "مستشار مناهج" },
  "Guided 900+ students to exam success": { fr: "Plus de 900 élèves menés à la réussite aux examens", ar: "قاد أكثر من 900 طالب إلى النجاح في الامتحانات" },
  "Created 12 interactive modules": { fr: "12 modules interactifs créés", ar: "أنشأت 12 وحدة تفاعلية" },
  "Top-rated in Life Sciences": { fr: "La mieux notée en sciences de la vie", ar: "الأعلى تقييماً في علوم الحياة" },
  "800+ students mentored": { fr: "Plus de 800 élèves accompagnés", ar: "رافقت أكثر من 800 طالب" },
  "Helped 300+ students pass IELTS": { fr: "Plus de 300 élèves aidés à réussir l'IELTS", ar: "ساعد أكثر من 300 طالب على اجتياز IELTS" },
  "Average band improvement +1.5": { fr: "Amélioration moyenne du score +1,5", ar: "تحسّن متوسط في الدرجة بمقدار +1.5" },
  "9 years teaching worldwide": { fr: "9 ans d'enseignement à l'international", ar: "9 سنوات من التدريس حول العالم" },
  "11 years teaching French": { fr: "11 ans d'enseignement du français", ar: "11 عاماً في تدريس الفرنسية" },
  "Certified FLE instructor": { fr: "Formatrice certifiée FLE", ar: "مدرّسة معتمدة FLE" },
  "1,100+ students mentored": { fr: "Plus de 1 100 élèves accompagnés", ar: "رافقت أكثر من 1100 طالب" },
  "13 years in academia & industry": { fr: "13 ans dans le milieu universitaire et l'industrie", ar: "13 عاماً في الأوساط الأكاديمية والقطاع" },
  "Author of 2 finance guides": { fr: "Auteur de 2 guides de finance", ar: "مؤلّف كتابَي إرشاد في المالية" },
  "Mentored 1,500+ students": { fr: "Plus de 1 500 élèves accompagnés", ar: "رافق أكثر من 1500 طالب" },
  "Created 10 narrated history modules": { fr: "10 modules d'histoire narrés créés", ar: "أنشأت 10 وحدات تاريخية مسرودة" },
  "Top new mentor 2023": { fr: "Meilleure nouvelle mentor 2023", ar: "أفضل مُوجّهة جديدة 2023" },
  "600+ students guided": { fr: "Plus de 600 élèves accompagnés", ar: "رافقت أكثر من 600 طالب" },

  // ---- Recorded-lesson topics (topicsForMajor) ----
  "Algebra Foundations": { fr: "Fondements de l'algèbre", ar: "أسس الجبر" },
  "Geometry Essentials": { fr: "Bases de la géométrie", ar: "أساسيات الهندسة" },
  "Intro to Calculus": { fr: "Introduction à l'analyse", ar: "مقدمة في التفاضل والتكامل" },
  "Statistics in Practice": { fr: "Statistiques en pratique", ar: "الإحصاء عملياً" },
  "Newtonian Mechanics": { fr: "Mécanique newtonienne", ar: "ميكانيكا نيوتن" },
  "Thermodynamics Basics": { fr: "Bases de thermodynamique", ar: "أساسيات الديناميكا الحرارية" },
  "Waves & Optics": { fr: "Ondes et optique", ar: "الموجات والبصريات" },
  "Programming Fundamentals": { fr: "Fondamentaux de la programmation", ar: "أساسيات البرمجة" },
  "Building Your First App": { fr: "Créer votre première application", ar: "بناء تطبيقك الأول" },
  "Working with Databases": { fr: "Travailler avec les bases de données", ar: "التعامل مع قواعد البيانات" },
  "Deploying to the Cloud": { fr: "Déploiement dans le cloud", ar: "النشر على السحابة" },
  "Atomic Structure": { fr: "Structure atomique", ar: "التركيب الذري" },
  "Organic Reactions": { fr: "Réactions organiques", ar: "التفاعلات العضوية" },
  "Chemical Bonding": { fr: "Liaisons chimiques", ar: "الروابط الكيميائية" },
  "Genetics 101": { fr: "Génétique 101", ar: "مبادئ علم الوراثة" },
  "Human Anatomy": { fr: "Anatomie humaine", ar: "التشريح البشري" },
  "Ecology & Ecosystems": { fr: "Écologie et écosystèmes", ar: "البيئة والنظم البيئية" },
  "Everyday Conversation": { fr: "Conversation quotidienne", ar: "المحادثة اليومية" },
  "Grammar Deep-Dive": { fr: "Grammaire approfondie", ar: "تعمّق في القواعد" },
  "Academic Writing": { fr: "Rédaction académique", ar: "الكتابة الأكاديمية" },
  "IELTS Speaking Prep": { fr: "Préparation à l'oral IELTS", ar: "تحضير محادثة IELTS" },
  "Les Bases du Français": { fr: "Les bases du français", ar: "أساسيات الفرنسية" },
  "Grammaire Essentielle": { fr: "Grammaire essentielle", ar: "القواعد الأساسية" },
  "Conversation Pratique": { fr: "Conversation pratique", ar: "المحادثة العملية" },
  "Compréhension Écrite": { fr: "Compréhension écrite", ar: "الفهم الكتابي" },
  "Microeconomics Basics": { fr: "Bases de microéconomie", ar: "أساسيات الاقتصاد الجزئي" },
  "Macroeconomics Overview": { fr: "Aperçu de macroéconomie", ar: "نظرة على الاقتصاد الكلي" },
  "Financial Markets": { fr: "Marchés financiers", ar: "الأسواق المالية" },
  "Personal Finance": { fr: "Finances personnelles", ar: "المالية الشخصية" },
  "The Ancient World": { fr: "Le monde antique", ar: "العالم القديم" },
  "The Modern Era": { fr: "L'époque moderne", ar: "العصر الحديث" },
  "Historical Analysis": { fr: "Analyse historique", ar: "التحليل التاريخي" },
  "Sources & Evidence": { fr: "Sources et preuves", ar: "المصادر والأدلّة" },
  "Introduction": { fr: "Introduction", ar: "مقدمة" },
  "Core Concepts": { fr: "Concepts clés", ar: "المفاهيم الأساسية" },
  "Advanced Topics": { fr: "Sujets avancés", ar: "مواضيع متقدمة" },
  "Practical Applications": { fr: "Applications pratiques", ar: "تطبيقات عملية" },

  // ---- "What you'll learn" lessons (getLessonsForMajor) ----
  "Electricity": { fr: "Électricité", ar: "الكهرباء" },
  "Waves": { fr: "Ondes", ar: "الموجات" },
  "Reactions": { fr: "Réactions", ar: "التفاعلات" },
  "Lab Work": { fr: "Travaux pratiques", ar: "العمل المخبري" },
  "Cells": { fr: "Cellules", ar: "الخلايا" },
  "Human Body": { fr: "Corps humain", ar: "جسم الإنسان" },
  "Programming Basics": { fr: "Bases de la programmation", ar: "أساسيات البرمجة" },
  "Data Structures": { fr: "Structures de données", ar: "هياكل البيانات" },
  "Projects": { fr: "Projets", ar: "مشاريع" },
  "Vocabulary": { fr: "Vocabulaire", ar: "المفردات" },
  "Practice": { fr: "Pratique", ar: "تدريب" },

  // ---- Join options (course detail) ----
  "Watch Recorded": { fr: "Regarder en différé", ar: "المشاهدة المسجّلة" },
  "Online Group Session": { fr: "Session de groupe en ligne", ar: "جلسة جماعية عبر الإنترنت" },
  "Private 1-on-1 Session": { fr: "Session privée en tête-à-tête", ar: "جلسة خاصة فردية" },
  "Full pre-recorded lessons you can watch anytime, at your own pace.": {
    fr: "Des cours entièrement préenregistrés à regarder à tout moment, à votre rythme.",
    ar: "دروس مسجّلة كاملة يمكنك مشاهدتها في أي وقت وبالوتيرة التي تناسبك.",
  },
  "Live revision session with a teacher and other students in the same module.": {
    fr: "Session de révision en direct avec un enseignant et d'autres élèves du même module.",
    ar: "جلسة مراجعة مباشرة مع أستاذ وطلاب آخرين في الوحدة نفسها.",
  },
  "A personalised individual session with the teacher, just for you.": {
    fr: "Une session individuelle personnalisée avec l'enseignant, rien que pour vous.",
    ar: "جلسة فردية مخصّصة مع الأستاذ، لك وحدك.",
  },
};

// Arabic transliteration of mentor names, keyed by mentor id.
const MENTOR_NAME_AR: Record<number, string> = {
  1: "أمينة بن علي",
  2: "ياسين خليفي",
  3: "صوفيا منصوري",
  4: "كريم بوعزيز",
  5: "لينا حجار",
  6: "عمر سليماني",
  7: "نادية شريف",
  8: "رياض بلقاسم",
  9: "سارة تومي",
};

/** Translate a single English phrase. Unknown strings pass through unchanged. */
export function tr(en: string | undefined | null, locale: Locale): string {
  if (!en) return en ?? "";
  if (locale === "en") return en;
  const entry = DICT[en];
  return entry ? entry[locale] : en;
}

/** Translate a list of English phrases. */
export function trList(items: string[], locale: Locale): string[] {
  return items.map((i) => tr(i, locale));
}

/** Split a comma-separated English string and translate each token. */
export function trSkills(csv: string, locale: Locale): string[] {
  return csv.split(",").map((s) => tr(s.trim(), locale));
}

/**
 * Mentor name for display. In Arabic we keep the English name and append the
 * Arabic beside it, e.g. "Amina Benali (أمينة بن علي)". Other languages: English.
 */
export function mentorDisplayName(
  mentor: { id: number; name: string },
  locale: Locale
): string {
  if (locale === "ar") {
    const ar = MENTOR_NAME_AR[mentor.id];
    return ar ? `${mentor.name} (${ar})` : mentor.name;
  }
  return mentor.name;
}

/**
 * Mentor professional title for display. In Arabic we keep the English title
 * and append the Arabic beside it. In French we show the French translation.
 */
export function mentorDisplayTitle(title: string, locale: Locale): string {
  if (locale === "ar") {
    const ar = DICT[title]?.ar;
    return ar ? `${title} (${ar})` : title;
  }
  return tr(title, locale);
}
