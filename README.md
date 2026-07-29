# E-Taalim

A prototype e-learning platform built around the Algerian education system.
Students find a mentor for their exact year and stream, buy a course with wallet
credit, follow the lessons, and message the mentor directly. Mentors run their
own teaching business from a dashboard. Administrators watch the whole platform
from a back-office.

The site is trilingual: English, French and Arabic.



## Why it's built this way

Most e-learning platforms sort courses into vague buckets like "Beginner",
"Intermediate" or "Mathematics". That is useless to a 2AS student in the Sciences
Expérimentales stream who needs a specific maths teacher for a specific
programme.

So the whole catalogue is modelled on the real education system instead, from
primary school all the way through university:

| Cycle | Years | Streams or majors |
|---|---|---|
| Primaire | 1AP to 5AP | none |
| Moyen | 1AM to 4AM | none |
| Secondaire | 1AS | Sciences core, Lettres core |
| Secondaire | 2AS and 3AS | Sciences Expérimentales, Maths, Techniques Maths, Gestion & Économie, Lettres & Philosophie, Langues Étrangères |
| Université (LMD) | Licence (L1 to L3), Master (M1, M2), Doctorat | free-text major, such as Computer Science, Mathematics or Economics |

Every course, every mentor and every student profile carries a cycle, a year and
(where it applies) a stream or a major. Filtering, matching and the dashboards
all speak that language. Mentors teach in one cycle only, and their coverage
expands downward inside it.

University works slightly differently from the school cycles: instead of picking
from a fixed list of streams, a student or mentor types their major, because no
fixed list would survive contact with every Algerian faculty.

Each course can be sold three ways: recorded, group session, or one-to-one, each
with its own price.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 with the React Compiler |
| Styling | CSS Modules |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Authorisation | Row Level Security |
| Live updates | Supabase Realtime |
| i18n | Custom provider (`src/i18n`) |
| Tests | Vitest |

## Features by role

### Visitor (not signed in)

| Area | What they can do |
|---|---|
| Home, About, Contact | Landing pages and a contact form |
| Course catalogue | Browse and filter by cycle, year, stream or major, subject and format |
| Course page | Description, lessons, price for each format, real student reviews |
| Mentor directory | Browse mentors and filter by what they teach |
| Mentor profile | Bio, subjects, experience, certificates, aggregate rating, their courses |
| Sign up | As a student or as a mentor. Minors are asked for a parent's contact |
| Language | Switch between English, French and Arabic at any time |

### Student

| Area | What they get |
|---|---|
| Overview | Enrolled courses, progress at a glance, upcoming sessions |
| My courses | Everything bought, with a lesson checklist that tracks real completion |
| Saved | Favourited courses |
| Mentors | The mentors they follow |
| Schedule | Session dates and times for their courses |
| Wallet | Balance, top-ups and a full transaction history |
| Receipts | Every purchase with its reference code |
| Messages | Direct, realtime conversation with their mentors, attachments included |
| Notifications | Mentor replied, course updated, a followed mentor published something new, enrolment confirmed |
| Profile | Identity, school year, and the parental-consent flow for under-age students |

Buying a course is a single database transaction: the balance is charged, the
enrolment is created and the receipt is logged together, or none of it happens.

### Mentor

| Area | What they get |
|---|---|
| Overview | Students, revenue and rating at a glance |
| My courses | Create, edit and delete courses, with a year and stream picker so the course lands in the right part of the catalogue |
| Students | The real roster of everyone enrolled, per course |
| Schedule | Their teaching calendar, built from their courses' sessions |
| Earnings | Revenue computed from actual enrolments and transactions |
| Messages | The other side of the student conversation, live |
| Notifications | New enrolment, new follower, new message |
| Profile | Full editor for bio, subjects, experience, certificates, photo and the years they teach, with a live preview of the public page it produces |

Sign-up asks a mentor exactly which years they teach, and enforces the one-cycle
rule described above.

### Administrator

The admin is a real Supabase user whose role is `admin` in the database, the same
fact the database's own security policies check, so the interface and the data
always agree.

| Area | What they get |
|---|---|
| Overview | Platform totals: students, mentors, courses, enrolments, revenue, ratings, latest reviews |
| Students | The full directory with filters by cycle and year, a detail view per student, and CSV export that opens correctly in Excel in any locale |
| Courses | Create, edit and delete any course. Changes reach students immediately |
| Mentors | The full mentor directory with their courses and ratings |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL and anon key
npm run dev                  # http://localhost:3000
```

## Project structure

```
src/app/(site)/   public pages plus the student and mentor dashboards
src/app/admin/    admin back-office
src/app/auth/     OAuth and email-link callback
src/components/   shared UI
src/lib/          data access, one file per feature, all talking to Supabase
src/data/         static catalogue data (education structure, seed mentors)
src/i18n/         translations and the locale provider
src/proxy.ts      session refresh and server-side route protection
```

## Security

Authorisation lives in Postgres, so the interface cannot be talked out of it.
On top of that: server-side route guards, a Content Security Policy and the usual
hardening headers, URL scheme checks on anything a user can store, and
database-verified admin access.

## Project status

E-Taalim is a prototype, not a live service. The software is finished and the
data is real: accounts, courses, enrolments, balances, messages and progress are
all rows in a Postgres database, protected by real policies. What a prototype
cannot have is a bank and a video library, so two things are simulated on
purpose, and the interface says so where a user would notice.

| Area | What is real | What is simulated |
|---|---|---|
| Payments | The wallet balance, checkout, the transaction record, the receipt, and the enrolment happening as one atomic database transaction | No payment provider is connected. Credit is granted by a top-up button, so no dinar ever moves. Before real money, top-ups have to come from a verified payment webhook instead |
| Lesson content | The course structure, the lesson list, the player, and progress tracking that records what you actually completed | Every course plays the same sample video, and the reading and quiz steps show a labelled placeholder rather than real teaching material |
| Mentors | Anyone who signs up as a mentor gets a real account, a real profile and real courses | Nine showcase mentors are seed data, so the directory is not empty on a fresh install |

Everything else is genuinely working: authentication (email and password, Google
sign-in, email confirmation, password reset), the catalogue, favourites, follows,
reviews, receipts, realtime messaging, notifications, all three dashboards, and
the admin export.

Database work (tables, policies, functions, triggers) lives in Supabase rather
than in this repository. When it changes, the commit message says so.
