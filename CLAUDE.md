# LIFTwod

LIFTwod app (early scaffold — project structure not yet built). This file documents conventions and guardrails for working in this repo.

## Account & project safety

LIFTwod runs on **different Vercel and Supabase accounts** than Joel's other apps in `~/ClaudeCode/` (ezekiel-rain-me-tool, oxcart). The access split is deliberate: the **MCP connectors stay authenticated to the ER accounts** for the other apps, while **all LIFTwod work uses CLIs with scoped tokens from this folder's `.env.local`** — each token's account/team contains only this project, so it physically cannot touch ER infrastructure. Never use the Vercel or Supabase MCP connector tools for LIFTwod work, and never rely on ambient machine-wide logins.

### Correct accounts for this app

| Service | Account / org | Project |
|---|---|---|
| Vercel | `projectfitadmin-3368`, team `project-fit` (`team_FZmj1Rbb6U5C6kWs7eAb2QFZ`) | `liftwod` (`prj_ZASx2KPDx9wSHQnXyodY14SYyJNY`) |
| Supabase | New account, org `hndqrrjzcoowtzfdabgy` (separate from ER org) | "Lift WOD", ref `mywwdnvrkdafujshwiqk` — https://mywwdnvrkdafujshwiqk.supabase.co |

The **wrong** accounts (used by the other apps — if you see these identifiers, stop): Vercel `joelk-4154` / team `erthai-jk-projects`; Supabase org `syabeupsorncbswqlsvc` ("jkarum's Org").

### Pre-flight checks

- **Vercel CLI**: always pass the team-scoped token from this folder's `.env.local` instead of relying on the machine-wide `vercel login`:
  `vercel --token $(grep -m1 '^VERCEL_TOKEN=' .env.local | cut -d= -f2) <cmd>`
  The token is scoped to the `project-fit` team only and cannot see the ER team, so commands with it physically cannot land in the wrong account. Without `--token`, the CLI uses the global login — whatever that happens to be — so bare `vercel` commands are not safe here. `.vercel/project.json` pins deploys from this folder to `project-fit/liftwod`, but it does not protect account-level commands like `env` or `domains`. Sanity check: `vercel teams ls` with the token shows only `project-fit`.
- **Supabase — use the CLI, not the MCP connector.** The Supabase MCP connector is authenticated to the **old ER org and cannot see this project**; never use MCP Supabase tools (`execute_sql`, `apply_migration`, …) for LIFTwod work, and never "fall back" to a project the connector *can* see. All LIFTwod database work goes through the Supabase CLI.
- **Supabase CLI**: installed (binary in the nvm bin dir, v2.109+). Auth is a project-scoped personal access token stored as `SUPABASE_ACCESS_TOKEN` in this folder's `.env.local` — the token's account contains **only** the Lift WOD project, so it physically cannot touch ER projects. The CLI does not auto-read `.env.local`; run commands from this folder as:
  `SUPABASE_ACCESS_TOKEN=$(grep -m1 '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2) supabase <cmd>`
  The folder is linked to `mywwdnvrkdafujshwiqk` (`supabase/config.toml` committed; link state in `supabase/.temp/`). Sanity check: `supabase projects list` must show only the Lift WOD project.
- **Env cross-check**: `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` must be `https://mywwdnvrkdafujshwiqk.supabase.co`. Credentials live only in `.env.local` (gitignored); production env vars are managed on the Vercel `liftwod` project.

## Stack & architecture (M1, 2026-07-10)

Next.js 16.2.9 (App Router, Turbopack) + native **Supabase Auth via @supabase/ssr** (NOT Clerk — deliberate divergence from the ER apps; RLS uses `auth.uid()`), Tailwind v4 CSS-first tokens, IBM Plex Sans Thai Looped. **Dark theme by default** (Joel's direction — Wodify-style; logo palette as accents: orange=primary/CTA, magenta=PR/Rx, teal=success, purple=Scaled/info). PRD: `Project-Fit-App-PRD-DRAFT.md`. Build plan: `~/.claude/plans/users-joelkarum-claudecode-liftwod-proj-stateful-wren.md`.

Key invariants (sister-app conventions kept):
- i18n = static typed JSON (`src/locales/{en,th}.json`, `LocaleKey = keyof typeof en`; th.json parity is a tsc check). ALL UI strings client-rendered via `t()`; language preference on `profiles.preferred_language`; never `whitespace-nowrap` on Thai text cells.
- Next 16: middleware is `src/proxy.ts`; `cookies()`/`params`/`searchParams` are async. Session validation via `auth.getClaims()` in the proxy; fine-grained gates in `src/lib/auth/guards.ts` (`requireUser` bounces unapproved accounts to `/pending`).
- Every race-prone mutation is a SECURITY DEFINER Postgres RPC returning `{ok, code, meta}` reason codes the UI translates: `book_class`, `cancel_booking`, `check_in`, `undo_check_in`, `admin_record_renewal`, `admin_create_hold/delete_hold`. Results validation + PR detection are DB triggers (results arrive on the realtime feed with `is_pr` already set). Never bypass with service-role writes.
- Service role allowed ONLY for: session-generation cron, auth admin (seed/invite email), outbox drainer. Admin UI actions go through user-context RLS.
- Migrations: `supabase/migrations/` via CLI `db push` (scoped token). After each: re-run security advisors (Management API `/advisors/security`) and `supabase gen types typescript --linked > src/lib/supabase/database.types.ts`.
- With `set search_path = ''`, schema-qualify EVERY enum reference in function bodies/declares (`public.booking_status` etc.) — sql-language bodies are validated at creation and fail otherwise.
- Supabase default privileges grant EXECUTE on new functions to anon/authenticated/service_role EXPLICITLY — revoking from PUBLIC is not enough; revoke per-role (see migration 0010).

Accepted advisor findings (intentional, do not "fix"): `security_definer_view` on `member_directory` (PDPA: members see names/avatars only, never profiles) and `session_availability` (capacity counts without exposing bookings).

## Auth model

- Signup → `handle_new_user()` trigger creates `profiles` row (pending). Admin approves at `/admin/users`, or an invite link (`/sign-up?invite=<token>`, from the `invites` table) sets role + instant approval — coaches only exist via invite. Role/approval changes are blocked for non-admins by the `profiles_integrity` trigger.
- Email confirmation is DISABLED (`mailer_autoconfirm: true`) — admin approval is the identity gate; built-in SMTP is ~2/hr. Before member rollout: configure Resend SMTP so password-reset emails work.
- Google OAuth: `/auth/callback` is already built; add credentials in Supabase dashboard + `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` when Joel supplies them.
- Admin bootstrap: `bootstrap_first_admin()` RPC promotes the caller iff zero admins exist (test admin already exists locally, so Joel's real account needs a one-off SQL promote or temporary use of the RPC after wiping test users in production).

## Dev & test

- Port **3002** (`npm run dev`; 3000=me-tool, 3001=oxcart). Launch config: workspace-root `.claude/launch.json`, name `liftwod`.
- Test users (`npm run seed:users`, idempotent, only touches `@test.liftwod`): admin@/coach@/member@/pending@test.liftwod, password `liftwod-test-1234`. Supabase Auth sign-in is same-origin → the sandboxed Preview tool CAN sign in (Clerk limitation doesn't apply).
- Preview-tool caveat: `preview_fill` + immediate click can outrun hydration/React state → native form submit. Fill via native value setter + `input` event dispatch in `preview_eval`, then `form.requestSubmit()`.
- Type check: `./node_modules/.bin/tsc --noEmit` (not `npx tsc` — me-tool lesson).
- Supabase CLI ships TWO binaries (`supabase` shim + `supabase-go`); both live in the nvm bin dir. Docker warnings from `db push` are harmless (no local stack).
- One Supabase project serves dev and previews until launch; migrations are forward-only.

## Deploy

- Vercel project `project-fit/liftwod`, framework `nextjs` (had to be set via API — the project predates the code), region `sin1` via vercel.json, daily cron 18:00 UTC = 01:00 Bangkok → `/api/cron/generate-sessions` (Bearer `CRON_SECRET`).
- Env vars set in BOTH Production and Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `CRON_SECRET`. Never put `SUPABASE_ACCESS_TOKEN`/`VERCEL_TOKEN` on Vercel — those are local CLI credentials.
- Preview deployments sit behind Vercel Authentication (team SSO) — view them logged into vercel.com as the new account. Production will be public.
- GitHub: remote `git@github.com-liftwod:projectfitcr/liftwod.git` (deploy key `~/.ssh/id_ed25519_liftwod`, SSH alias in `~/.ssh/config`).
- **Git author (resolved 2026-07-10)**: the Project Fit team is Vercel Hobby = single member, so deployments authored by non-member emails get BLOCKED. Fix in place: repo-local `git config user.email = projectfitadmin@gmail.com` (the team owner), existing commits rewritten before first push. Never commit here with the global (jkarum@gmail.com) identity.

## PWA (M8)

- Icons generated by `scripts/gen-icons.mjs` (sharp, dev dep) from `branding/mobilelogo.png` — rerun after any logo change. Maskable variants = 80% scale on brand black.
- `public/sw.js` is hand-rolled (next-pwa unmaintained; Serwist adds Turbopack build coupling v1 doesn't need). Offline scope is READS ONLY: network-first navigations with runtime cache for today/schedule/wod/whiteboard/results; cache-first `_next/static` + fonts + icons; `/offline` fallback (bilingual, no i18n provider). **Bump `VERSION` in sw.js when changing caching behaviour.** Registration is production-only (RegisterSW in the root layout) — dev never has a SW; test PWA behaviour on the deployed URL or a real phone.
- Manifest: `src/app/manifest.ts` (start_url `/today`, standalone, `#0b0b0f`).

## Launch-day checklist (run when Joel says "launch")

Production is continuously deployed from `main` (Vercel Git integration); the same Supabase project serves dev and prod, so launch = data cutover, not infra:

1. **DNS**: CNAME `liftwod` → `d4de0c003864fac1.vercel-dns-017.com` on projectfitcr.com (Squarespace DNS). Domain is already attached + verified on the Vercel project.
2. **Wipe test data** (scoped SQL via CLI, in order): results/prs/attendance/bookings/notes/payments/holds/memberships/notification_outbox → class_sessions/class_templates → non-baseline workouts+components → invites → auth users @test.liftwod (auth admin API, cascades profiles) → avatars bucket objects for deleted users. Keep: plans, exercises, benchmarks, locations, app_settings, baseline containers.
3. **First real admin**: after the wipe there are zero admins — Joel signs up in the app, then promote via scoped SQL (`update profiles set role='admin', approved_at=now() where email='...'`) or he calls `bootstrap_first_admin()` (works iff zero admins).
4. **Resend SMTP** into Supabase Auth (dashboard → Auth → SMTP) so password resets deliver; sender e.g. `no-reply@projectfitcr.com`.
5. **Real schedule**: admin creates the real class templates (test template set was wiped in step 2).
6. Thai review: `th.json` (Joel) + exercise `name_th` (Thai-speaking coach, editable at /coach/exercises).
7. Real phone: install to home screen, airplane-mode check.
