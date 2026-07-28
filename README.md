# E-Taalim (Next.js)

An Algerian e-learning platform: a course catalogue that follows the real school
system (primaire → moyen → secondaire, with the 2AS/3AS streams), mentor
profiles, student and mentor dashboards, a wallet, realtime messaging, and an
admin back-office. Trilingual — English, French and Arabic (RTL).

This is the Next.js rewrite of the original PHP site, which lives in the parent
folder.

## Stack

- **Next.js 16** (App Router, React 19, React Compiler) — the frontend *and* the
  backend; no separate server.
- **Supabase** — Postgres, Auth (email/password + Google), Realtime, Row Level
  Security. All authorisation lives in the database.
- **CSS Modules**, no UI framework.
- **Vitest** for unit tests.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project URL + anon key
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run once) |

## Environment

See `.env.example`. Two variables are required (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`); `NEXT_PUBLIC_SITE_URL` should be set in
production so the sitemap, robots.txt and link previews use the real domain.

The anon key is *meant* to be public. The `service_role` key must never appear
in this project.

## Layout

```
src/app/(site)/   public pages + the student & mentor dashboards
src/app/admin/    admin back-office (a real Supabase user with role = 'admin')
src/app/auth/     OAuth / email-link callback
src/components/   shared UI
src/lib/          data access — one file per feature, all talking to Supabase
src/data/         static catalogue data (education structure, seed mentors)
src/i18n/         translations + the locale provider
src/proxy.ts      session refresh + server-side route protection
```

## Docs

- `security-process.md` — what protects the app, and what to harden next.
- `hosting-process.md` — how to put it online (Vercel), and domain names.
- `backend-process.md` — how the Supabase backend was built (**not committed**:
  it contains credentials).

Database work — tables, policies, functions, triggers — lives in Supabase, not
in this repo. When you change it, note it in the commit message.
