# E-Taalim

An e-learning platform built around the **Algerian school system**. Students find
a mentor for their exact year and stream, buy a course with wallet credit, follow
the lessons, and message the mentor directly. Mentors run their own teaching
business from a dashboard. Administrators watch the whole platform from a
back-office.

The site is trilingual — **English, French and Arabic**.

This is the Next.js rewrite of the original PHP version, which lives in the
parent folder of this repository.

---

## Why it's built this way

Most e-learning platforms sort courses into vague buckets — "Beginner",
"Intermediate", "Mathematics". That's useless to a *2AS student in the Sciences
Expérimentales stream* who needs a specific maths teacher for a specific
programme.

So the whole catalogue is modelled on the real school structure instead:

| Cycle | Years | Streams |
|---|---|---|
| Primaire | 1AP – 5AP | — |
| Moyen | 1AM – 4AM | — |
| Secondaire | 1AS | Sciences core, Lettres core |
| | 2AS – 3AS | Sciences Expérimentales, Maths, Techniques Maths, Gestion & Économie, Lettres & Philosophie, Langues Étrangères |

Every course, every mentor and every student profile carries a cycle, a year and
(where it applies) a stream. Filtering, matching and the dashboards all speak
that language. Mentors teach in **one cycle only**, and their coverage expands
downward inside it.

Each course can be sold three ways: **recorded**, **group session** or
**one-to-one**, each with its own price.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | It is the frontend *and* the backend — Server Components, Route Handlers and a proxy layer in one deploy. No separate Express server. |
| UI | **React 19** + React Compiler | Compiler handles memoisation, so the components stay readable. |
| Styling | **CSS Modules** | No UI framework, no Tailwind — scoped, hand-written CSS. |
| Database | **Supabase Postgres** | The data is deeply relational (students ↔ enrollments ↔ courses ↔ mentors ↔ reviews), so a relational database, not a document store. |
| Auth | **Supabase Auth** | Email/password + Google, email confirmation, password reset, one account per address. |
| Authorisation | **Row Level Security** | Permissions live in the database, next to the data — not in the UI, where anyone could bypass them. |
| Live updates | **Supabase Realtime** | Messages and notifications arrive by subscription, not polling. |
| i18n | Custom provider (`src/i18n`) | Three languages with RTL, no dependency. |
| Tests | **Vitest** | Unit tests on the logic that breaks silently. |

---

## Features by role

### Visitor (not signed in)

| Area | What they can do |
|---|---|
| Home / About / Contact | Landing pages, contact form |
| Course catalogue | Browse and filter by cycle, year, stream, subject and format |
| Course page | Description, lessons, price for each format, real student reviews |
| Mentor directory | Browse mentors, filter by what they teach |
| Mentor profile | Bio, subjects, experience, certificates, aggregate rating, their courses |
| Sign up | As a student or as a mentor; minors are asked for a parent's contact |
| Language | Switch between English, French and Arabic at any time |

### Student

| Area | What they get |
|---|---|
| Overview | Enrolled courses, progress at a glance, upcoming sessions |
| My courses | Everything bought, with a lesson checklist that tracks real completion |
| Saved | Favourited courses |
| Mentors | The mentors they follow |
| Schedule | Session dates and times for their courses |
| Wallet | Balance, top-ups, and a full transaction history |
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
| Profile | Full editor — bio, subjects, experience, certificates, photo, the years they teach — with a live preview of the public page it produces |

Sign-up asks a mentor exactly which years they teach, and enforces the
one-cycle rule described above.

### Administrator

The admin is a real Supabase user whose role is `admin` in the database — the
same fact the database's own security policies check, so the interface and the
data agree.

| Area | What they get |
|---|---|
| Overview | Platform totals: students, mentors, courses, enrolments, revenue, ratings, latest reviews |
| Students | The full directory with filters by cycle and year, a detail view per student, and CSV export that opens correctly in Excel in any locale |
| Courses | Create, edit and delete any course; changes reach students immediately |
| Mentors | The full mentor directory with their courses and ratings |

---

## Getting started

```bash
npm install
cp .env.local   # fill in your Supabase project URL + anon key
npm run dev                  # http://localhost:3000
```


---

## Project structure

```
src/app/(site)/   public pages + the student and mentor dashboards
src/app/admin/    admin back-office
src/app/auth/     OAuth and email-link callback
src/components/   shared UI
src/lib/          data access — one file per feature, all talking to Supabase
src/data/         static catalogue data (education structure, seed mentors)
src/i18n/         translations and the locale provider
src/proxy.ts      session refresh + server-side route protection
```

---

## Security

Authorisation lives in Postgres, so the interface can't be talked out of it.
On top of that: server-side route guards, a Content Security Policy and the usual
hardening headers, URL scheme checks on anything a user can store, and
database-verified admin access.

---

## Project status

Real and working: authentication (email/password, Google, confirmation, password
reset), the course catalogue, enrolment, the wallet, favourites, follows,
reviews, lesson progress, receipts, realtime messaging, notifications, all three
dashboards, and admin export.

Deliberately not real yet: **payments**. The wallet is credit you grant yourself,
because no payment provider is connected. Before real money, top-ups have to come
from a verified payment webhook rather than a button.

---

Database work — tables, policies, functions, triggers — lives in Supabase rather
than in this repository. When it changes, the commit message says so.
