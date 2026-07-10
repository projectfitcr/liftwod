# PRD — Project Fit Gym App (DRAFT)

**Organization:** Project Fit, Chiang Rai (functional fitness gym, business-as-ministry)
**Author:** Joel Karum (drafted with Claude)
**Date:** July 9, 2026
**Status:** DRAFT — pending review

---

## 1. Problem Statement

Project Fit currently has no software for running the daily life of the gym: publishing workouts, booking classes, tracking attendance, logging member results, and managing memberships. Commercial platforms like Wodify are built for US-market gyms, priced in USD per month, English-only, and bundled with payment processing the gym doesn't need. Coaches and members need one simple, bilingual (Thai/English) app that handles the whole loop — see today's workout, book a class, check in, log a score, see progress — and gives staff a clear picture of who is a member, who is active, and who is drifting away.

## 2. Goals

1. **Members can self-serve the core loop**: view the schedule and daily workout, book/cancel a class, and log their score from their phone — in Thai or English.
2. **Coaches run class from one screen**: roster, check-in, today's WOD, and a whiteboard/leaderboard, usable on a phone or a gym TV.
3. **Staff manage membership without spreadsheets**: plans, start/end dates, holds, renewals, and payment status (recorded manually — no in-app payments).
4. **Retention becomes visible**: attendance history and streaks surface members who haven't shown up recently so coaches can follow up personally — this is the ministry side of the gym, not just business.
5. **Total running cost stays near zero** on free tiers of the existing stack.

## 3. Non-Goals

- **Payment processing.** No cards, no PromptPay integration, no invoicing engine in v1. Staff record payments manually against a membership. (Rationale: explicitly out of scope per owner; Thai gyms commonly take bank transfer/PromptPay outside the app.)
- **Native iOS/Android apps.** v1 is a responsive web app installable as a PWA. (Rationale: app-store publishing is a large ongoing cost/effort; a PWA covers phone use at the gym.)
- **Multi-location UI in v1.** A second location is a ~3-year goal (land/building search underway), so v1 ships single-location — **but the data model is multi-location from day one** (see 7). No multi-location screens, filters, or reports until location #2 is real. (Rationale: designing it in now costs almost nothing; building UI for a location that doesn't exist yet does.)
- **Retail/store, lead-gen CRM, SMS marketing, email campaigns.** (Rationale: Wodify features aimed at US gym growth marketing; not the problem being solved.)
- **Video content library / streaming.** (Rationale: movement demo links can be plain YouTube links in the exercise library; hosting video is a separate project.)

## 4. Users & Roles

| Role | Who | Can do |
|---|---|---|
| **Admin** | Gym owner/manager | Everything: memberships, plans, schedules, users, reports, settings |
| **Coach** | Coaching staff | Program WODs, manage class rosters, check members in, enter/edit scores, add member notes, view attendance |
| **Member** | Gym members | View schedule & WODs, book/cancel classes, check in, log own scores, view own history/PRs, see leaderboard |
| **Drop-in / Trial** *(P1)* | Visitors | Limited: book a class, sign waiver, log score for that day |

All user-facing screens available in Thai and English; each user picks their language.

## 5. User Stories (priority order)

**Member**
- As a member, I want to see this week's class schedule and today's WOD so I can plan my training.
- As a member, I want to book a class (and join a waitlist if full) so I have a guaranteed spot.
- As a member, I want to log my result (time / rounds+reps / load), marked Rx or scaled, so my progress is recorded.
- As a member, I want to see my history and PRs for benchmark workouts and main lifts so I can see improvement.
- As a member, I want to see the day's whiteboard/leaderboard so I stay connected to the community.
- As a member, I want to see my membership status (plan, expiry, remaining classes) so there are no surprises.

**Coach**
- As a coach, I want to build and publish workouts from an exercise library so programming is fast and consistent.
- As a coach, I want a class-day view with the roster so I can check people in and enter scores for the whole class.
- As a coach, I want to see who hasn't attended in 2+ weeks so I can reach out personally.
- As a coach, I want to add private notes on a member (injuries, scaling needs) so any coach can serve them well.

**Admin**
- As an admin, I want to manage membership plans (unlimited, 3x/week limited, punch card, drop-in, volunteer rate) and assign them to members.
- As an admin, I want to record a payment received (amount in THB, date, method) against a membership so status stays accurate without processing money in-app.
- As an admin, I want memberships to expire/deplete automatically and see who's due for renewal this week.
- As an admin, I want to pause (hold) a membership for travel/injury so end dates adjust fairly.
- As an admin, I want simple reports: active members, attendance per class, renewals due, lapsed members.

**Edge cases**
- Member cancels inside the cancellation window → spot released, first waitlisted member auto-promoted and notified.
- Member with expired membership tries to book → blocked with a friendly bilingual message to see the front desk.
- Two coaches edit the same WOD → last save wins with a visible "last edited by" stamp (v1 keeps this simple).
- Member logs a score for a class they didn't attend → allowed but flagged "open gym / not checked in."

## 6. Requirements

### P0 — Must have (v1 cannot ship without)

**6.1 Accounts & roles**
- Sign-in via email or Google (Supabase Auth). Admin invites coaches; members self-register with admin approval or invite link.
- Role-based access as in section 4. Language preference per user (TH/EN).
- ✅ *Given* a member account, *when* they open any page, *then* all UI text renders in their chosen language.

**6.2 Membership management (no payments)**
- The plan engine supports four types: **unlimited by period**, **weekly-limited** (max N visits per week), **visit pack** (punch card), and **drop-in**.
- Project Fit's actual plans (seed these at launch):

| Plan | Price (THB) | Type / rule |
|---|---|---|
| Unlimited | 1,900 / month | Unlimited visits |
| Limited | 1,600 / month | Max 3 visits per week (Mon–Sun) |
| Punch card | 2,000 | 10 visits — expiry TBD (assume no expiry until confirmed) |
| Drop-in | 400 | Single visit |
| Volunteer | 600 / month | Unlimited visits *(assumed — confirm)* at volunteer rate |

- Assign plan to member with start date; system computes end date / remaining visits.
- Weekly limit counts **booked classes** per Mon–Sun week (Asia/Bangkok); a cancellation before the cutoff frees that week's slot back.
- ✅ *Given* a Limited member already booked into 3 classes this week, *when* they try to book a 4th, *then* booking is blocked with a bilingual message showing when their limit resets.
- Manual payment record: amount (THB), date, method (cash / transfer / PromptPay / other), free-text note. Membership status derives from records: *Active, Expiring soon (≤7 days), Expired, On hold*.
- Holds: pause with a date range; end date extends by the hold length.
- ✅ *Given* a 10-class pack, *when* the member checks into a class, *then* remaining classes decrement by one and show in their profile.
- ✅ *Given* an expired membership, *when* the member tries to book, *then* booking is blocked with a clear message (does not silently fail).

**6.3 Class schedule & booking**
- Admin/coach create recurring class templates (e.g., WOD 6:00, 9:00, 17:30 Mon–Sat) with capacity and assigned coach; generate/edit individual sessions.
- Members book and cancel; configurable cancellation cutoff (e.g., 2 hours before). Waitlist with auto-promotion.
- All times in Asia/Bangkok (ICT).
- ✅ *Given* a full class, *when* a booked member cancels before cutoff, *then* the first waitlisted member is promoted and notified.

**6.4 Check-in & attendance**
- Coach checks members in from the class roster (one tap). Member self-check-in allowed at the gym (P0 keeps it simple: a button, no geofencing).
- Attendance history per member and per class; feeds membership depletion and retention flags.

**6.5 Workout programming (WOD builder)**
- Exercise/movement library (name in EN + TH, category, optional demo video URL). Seeded with common functional-fitness movements.
- Workout builder: components (warm-up, strength, metcon, cooldown), each with a **score type**: time, rounds+reps, load, reps, distance, calories, or "no score."
- Benchmark workouts flagged (e.g., named WODs) so results compare across time.
- Publish a WOD to a date/class; option to hide until a set time (e.g., day before at 20:00).
- Coach notes per workout (scaling options), visible to members.

**6.6 Performance tracking & whiteboard**
- Members (or coaches on their behalf) log results per scored component, marked **Rx / Scaled**, with optional comment.
- Automatic PR detection for benchmarks and tracked lifts; PR history per member.
- **Whiteboard view**: for a given day/class, all logged results ranked by score type (Rx above scaled), designed to look good on a phone *and* full-screen on a gym TV.
- ✅ *Given* a member logs 3:45 on a benchmark previously done in 4:10, *then* the result is badged as a PR on the whiteboard and in their history.

**6.7 Bilingual UI**
- Full Thai/English UI (IBM Plex Sans Thai Looped, consistent with other apps). Workout content entered by coaches can be either language; UI chrome is always translated.

### P1 — Should have (fast follows)

- **Notifications via LINE Official Account** (booking confirmations, waitlist promotion, class cancellations, membership expiring). LINE is the default channel in Thailand — more reliable than email, no SMS cost. Email as fallback.
- **Kiosk mode**: locked-down tablet/TV screen at the gym showing today's classes + self-check-in + whiteboard.
- **Retention dashboard**: streaks, "at-risk" list (no attendance in N days), lapsed members; one-tap "mark as contacted."
- **Digital waiver / member agreement** with PDPA-compliant consent capture at sign-up (Thailand's Personal Data Protection Act applies — the gym holds personal and health-adjacent data).
- **Coach notes on members** (private to staff): injuries, scaling, pastoral-care notes.
- **Announcements**: admin posts to all members (app banner + LINE push).
- **Drop-in/trial flow**: quick-create a visitor, waiver, one-day access.
- **Basic reports export** (CSV): attendance, memberships, renewals.

### P2 — Future considerations (design for, don't build)

- **Second location (~3 years out).** When it opens: per-location class schedules and rosters, a location switcher for coaches/admin, and reports filterable by location. **Memberships stay gym-wide, so any member can book and check in at either location** — this falls out naturally from the v1 data model (see 7) and requires no membership changes later.
- Family/linked accounts (parent manages kids' memberships).
- Personal-training / appointment booking (1:1 sessions).
- Body-composition / goal tracking beyond workout scores.
- Simple retail log (protein, apparel — recorded, not sold in-app).
- Community features fitting the ministry identity (events, testimonies, prayer/care requests) — worth a separate conversation before building.
- Native app wrappers if PWA adoption proves painful.

## 7. Technical Approach

**Stack (recommended): keep the current stack.**
- **Next.js (App Router) on Vercel**, Singapore region (`sin1`) — same as Oxcart et al. Deployed at **`liftwod.projectfitcr.com`**.
- **Supabase** (`ap-southeast-1`), **new dedicated project** — Project Fit is a separate organization from Ezekiel Rain; its data should not live in the ER Supabase project.
- **Supabase Auth** for sign-in — email + Google for members (no Microsoft SSO needed; members are ordinary gym-goers). No separate auth vendor.
- **PWA** (installable, offline-tolerant schedule/WOD view) instead of native apps.
- **LINE Messaging API** (Official Account) for notifications (P1).

**⚠️ Accounts & ownership — read before creating anything:**
- **GitHub:** repo lives under the **`projectfitcr` organization** — NOT under Joel's personal account and NOT under any Ezekiel Rain org.
- **Vercel:** deploy under the **dedicated Project Fit Vercel account** — NOT the Ezekiel Rain Vercel account used by Oxcart and the other ER apps.
- **Supabase:** create the project under the **dedicated Project Fit Supabase account** — NOT inside the Ezekiel Rain Supabase organization or project.
- Project Fit is a separate organization from Ezekiel Rain; nothing for this app may be created in ER accounts. **Before creating any repo, project, or deployment, verify which account the CLI/tool is authenticated as** (`gh auth status`, `vercel whoami`, Supabase project ref) and stop and ask if it resolves to an ER or personal account.

**Stack decisions vs. the other ER apps:** Same Next.js/Vercel/Supabase foundation, with one deliberate change — **Supabase Auth instead of Clerk.** Rationale: this app's row-level security (members see only their own data; coaches see all) integrates natively when auth is also Supabase, it removes a vendor account for Project Fit to maintain, and the Clerk consistency argument doesn't apply here since the other apps use Clerk specifically for Microsoft staff SSO, which this app won't use. Trade-off accepted: sign-in screens are built in-app rather than provided by Clerk (~a day of work).

**Data model (core tables, indicative):** `locations`, `users`, `memberships`, `membership_plans` (with `plan_type` and `weekly_visit_limit`), `payments` (manual records), `holds`, `class_templates`, `class_sessions`, `bookings`, `attendance`, `exercises`, `workouts`, `workout_components`, `results`, `prs`, `notes`, `announcements`.

**Key technical notes**
- **Multi-location-ready from v1:** a `locations` table (seeded with one row: Chiang Rai), and `location_id` on `class_templates`, `class_sessions`, and `attendance`. Memberships, plans, results, and PRs are **member-level, not location-level** — so cross-location booking and check-in works automatically when location #2 opens. v1 UI simply never shows a location picker.
- Row-level security: members read/write only their own results & bookings; coaches read all members; admin full.
- Whiteboard can use Supabase Realtime so scores appear live during class.
- Timezone hard-set to Asia/Bangkok; no multi-TZ logic.
- Seed script for the exercise library (bilingual names).

## 8. Success Metrics

**Leading (first 30 days)**
- ≥80% of active members have created an account and booked at least one class through the app.
- ≥60% of class attendees log a score on WOD days.
- Coaches publish 100% of WODs through the app (no more whiteboard-only programming).

**Lagging (90 days)**
- Membership records in-app match reality (zero members tracked "on paper" outside the system).
- Staff report ≥2 hours/week saved on admin (self-reported).
- At least one lapsed member re-engaged via the at-risk list (retention loop proven).

## 9. Open Questions

1. **[Owner]** Roughly how many members and coaches? (Sizes the rollout, not the architecture.)
2. **[Owner]** Two details on the plans in 6.2: (a) does the 10-visit punch card expire, and if so after how long? (b) is the Volunteer plan (฿600) unlimited visits or limited? Both are assumed in 6.2 and easy to change.
3. **[Owner]** Is there a TV/tablet at the gym for the whiteboard/kiosk? (Affects P1 priority.)
4. **[Owner]** Does Project Fit already have a LINE Official Account? (Needed for P1 notifications.)
5. **[Owner]** Who is the admin day-to-day — gym owner, a manager, or you?
6. **[Legal, non-blocking]** Confirm PDPA consent wording for the waiver with whoever handles the gym's compliance.

## 10. Phasing

- **Phase 1 (P0):** Auth & roles → membership management → schedule & booking → check-in → WOD builder → results & whiteboard → bilingual UI. Ship to coaches first, then members.
- **Phase 2 (P1):** LINE notifications, kiosk mode, retention dashboard, waivers/PDPA, reports.
- **Phase 3 (P2):** Revisit after 90 days of real use.

---

*DRAFT — not approved. Feature scope modeled on the Wodify category (scheduling, performance tracking, membership, retention) but specified independently for Project Fit's context.*
