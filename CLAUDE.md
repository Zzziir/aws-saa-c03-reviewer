@AGENTS.md

# SAA-C03 Reviewer — Lance's personal AWS exam trainer

A Next.js app that helps Lance prepare for the **AWS Certified Solutions Architect – Associate (SAA-C03)** exam. Web + mobile (responsive), multi-user. **Supabase-backed** (email/password auth + per-user progress), git remote on GitHub (`Zzziir/aws-saa-c03-reviewer`), **deployed on Vercel** (`aws-saa-c03-reviewer.vercel.app`, auto-deploys on push to `main`; repo is public so Vercel Hobby builds it).

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (note: this shadcn version is built on **Base UI** `@base-ui/react`, not Radix — `Button` has no `asChild`; use `buttonVariants` on a `<Link>`, or Base UI's `render` prop)
- **framer-motion** for motion, **zustand** for state (synced to Supabase per signed-in user via `lib/db/progress.ts`; hydrated on sign-in)
- **lucide-react** icons
- **@supabase/ssr** for auth (cookie-based sessions; route protection in `proxy.ts` → `lib/supabase/middleware.ts`)

Design language ports the original single-file prototype: AWS-orange (`--brand #ff9900`) on ink, Space Grotesk / Inter / JetBrains Mono. Motion follows the Emil Kowalski + Impeccable skills (custom easings in `globals.css`, `transform`/`opacity` only, `prefers-reduced-motion` respected, short purposeful durations).

## Architecture

- `lib/questions.data.json` — **530 questions** (source of truth): the original 200 (from the `../aws-saa-c03-reviewer (2).html` prototype) + 300 added (ids 201–500, scenario-heavy, original-authored) + 30 "Choose three" (ids 501–530). Fields: `id, domain, difficulty, question, options[], answer (number | number[]), explanation, keyTakeaway`. Domain mix follows exam weights.
  - **Multi-answer convention:** `answer` is a `number` (single) or sorted `number[]` (multi). **Option counts: single-answer = 4, "Choose two" = 5, "Choose three" = 6.** The runner renders options in stored order (no runtime shuffle), so multi-answer options are authored with the correct choices at varied indices. `isMultiAnswer` = answer array length > 1 (handles 2 or 3); scoring is an exact set match.
- `lib/topics.ts` — fine-grained AWS service/**topic taxonomy** (22 topics across the 4 domains): `TopicSlug`, `TOPICS`, `TOPIC_META`, `TOPICS_BY_DOMAIN`.
- `lib/question-topics.ts` — **generated** map of `questionId → TopicSlug` (one topic per question). Topic is attached to each `Question` at load in `lib/questions.ts`. (Generator + tag scripts live in a scratchpad, not the repo; keyword-based with a few hand overrides.)
- `lib/questions.ts` — typed access, `DOMAIN_META`, `DIFFICULTY_META`, `PASS_PCT = 72`, `countAvailable()`; attaches `topic` to each question.
- `lib/types.ts` — `Question` (now includes `topic`), `SessionConfig`, `ActiveSession`, `Attempt`, etc.
- `lib/session-utils.ts` — pure logic: `buildQuestionIds` (filter by difficulty/domain + shuffle), scoring (`isSelectionCorrect`, single & multi-answer), `finalizeAttempt`, timer math (`liveElapsed`, `remainingSec`), formatters.
- `lib/analytics.ts` — aggregates history into domain/difficulty mastery, score series, consistency, weakest domain; plus **per-topic** stats (`computeTopicStats`, `classifyTopics`) and the weighted **suggested-set** builder (`buildSuggestedSet`). Thresholds: strength ≥80%, weakness <60%, min 5 answered.
- `lib/store.ts` — zustand store **synced to Supabase** (not localStorage): `settings`, resumable `active` session, `history`, `flaggedIds`. Writes go through `lib/db/progress.ts` (debounced); `record_attempt` RPC records finished attempts. Gate client UI on `useHydrated()` to avoid SSR mismatch.
- `lib/db/progress.ts` — Supabase data layer: load/save state, `recordAttempt`, `fetchLeaderboard`, `saveExamDate`, flags.

### Routes
`/` home dashboard · `/practice` setup · `/session` runner (own chrome; nav hidden) · `/results/[id]` · `/history` · `/analytics` · `/flagged` · `/services` cheat-sheet · `/login` · `/signup` · `/auth/confirm` (email-confirmation handler: accepts both PKCE `?code=` and `token_hash`). Non-auth routes require a session (enforced in the proxy/middleware).

## Domains & difficulty
Domains: `secure` (30%), `resilient` (26%), `performance` (24%), `cost` (20%). Difficulty: `easy | medium | hard`; setup filter also has **Mixed** (all). Difficulty is a **pool filter** (Hard = only hard questions), per Lance's choice.

## Product decisions (confirmed with Lance)
- Rebuild in Tailwind + shadcn (not a 1:1 CSS port).
- Difficulty = filter the pool.
- Study extras included: **flag/bookmark questions**, **service cheat-sheet**, **weak-domain focus mode**.
- Two modes: **Reviewer** (instant per-question feedback, green/red) and **Exam** (score + full review only at the end).
- Question count 5–65 in steps of 5; timer default 2h, adjustable, pausable in both modes; questions randomized; progress persisted; end screen shows score, per-question review dropdown with highlighted corrections, duration, date; history + analytics pages.

## Session runner (`components/session/`)
The live-run UI has its own dark chrome (`exam-bar.tsx`, always dark `bg-[#1e2a38]` like the main nav — the site nav is hidden on `/session`). `session-runner.tsx` orchestrates state; `question-card.tsx` renders one question.
- **Header controls** (in `exam-bar.tsx`): timer, mode badge, a left **Review** button (opens the drawer), `answered/total`, a **theme toggle** (reuses `components/layout/theme-toggle.tsx` — toggles the session body/card between dark & light; the bar itself stays dark), a **Bionic** toggle, Pause, and Submit. (The old grid "Jump to question" palette was **removed** — the drawer replaces it.)
- **Bionic reading mode** (`bionic-text.tsx`) — toggleable reading aid that bolds each word's leading ~40% (fixation) across the question, options, explanation, and key takeaway. Preference is **device-local** (localStorage key `saa:bionic`, read via `useSyncExternalStore` — deliberately *not* in the Supabase-synced settings, since it's a per-device aid). `BionicText` bolds via font-weight only (inherits color) so it works inside colored text like the key-takeaway.
- **Review drawer** (`question-drawer.tsx`) — left slide-in listing every question so the user can go **back** to review earlier answers. **Answered** questions jump on click; **unanswered/unreached** ones are **locked** (disabled, dimmed, lock icon) and show a `—` dash instead of the question text (so upcoming questions aren't previewed). **Flagged** questions get a "Flagged" pill. Keyboard shortcuts are suppressed while the drawer (or submit-confirm) is open.

## Personalized home features
Home (`components/home/`) shows, per signed-in user:
- **Exam countdown** (`exam-countdown.tsx`) — editable via a pop-out calendar. Reads `user.user_metadata.target_exam_date`; on edit writes both auth metadata and `profiles.target_exam_date`. Also collected at signup.
- **Strengths & weaknesses** (`skill-breakdown.tsx`) — per **topic** (client-side from history), strengths ≥80% / weaknesses <60% (min 5 answered).
- **Suggested exam set** — weighted mix (~65% weak / 20% developing / 15% maintain); launches via `startFromQuestions`.
- **Leaderboard** (`leaderboard.tsx`) — cross-user, via the `get_leaderboard()` RPC. **Streak** = consecutive **Asia/Manila** days with **≥30 questions** answered; **points = correct + 10 × streak**.

## Commands
```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build (also runs tsc + lint)
npm run lint
```

## Supabase
This project has a dedicated Supabase project. Use the **`Reviewer-supabase-mcp`** MCP server (user/global scope, connected) for all Supabase operations here — do **not** use the other `supabase-*` MCP servers (those are unrelated projects).
- **Project ref:** `uxyikqmonjhlhhalbvte` (URL `https://uxyikqmonjhlhhalbvte.supabase.co`)
- The MCP server is scoped to this ref and has write access (not read-only), so it can run migrations. Regenerate `lib/supabase/database.types.ts` after schema changes.
- **Tables** (RLS per-user): `profiles` (incl. `target_exam_date`), `user_settings`, `questions` (530), `active_session`, `attempts`, `attempt_answers`, `flagged_questions`. `handle_new_user` trigger seeds `profiles`/`user_settings` on signup (and captures `target_exam_date` from metadata).
- **RPCs:** `record_attempt` (inserts attempt + answers; inner-joins `questions` for `domain`/`difficulty`), `get_leaderboard` (SECURITY DEFINER, authenticated-only; cross-user aggregates + streak/points — exposes only display names + aggregates).
- **`questions` CHECK constraints:** `options` length must be **between 4 and 6** (relaxed from `=4` for the 5/6-option multi-answer questions) and `answer` a non-empty jsonb array. **Seed caveat:** DB rows for questions 201–530 carry accurate `id/domain/difficulty` but *placeholder* text/options/answer — the app renders question content from the bundled JSON, never DB text; `record_attempt` only reads domain/difficulty. (Original 200 DB rows have full content; the 37 retrofitted "Choose two" among them were updated in-place to 5 options.)
- **Auth config (dashboard):** the email-confirm redirect target must be in **Auth → URL Configuration → Redirect URLs** (`http://localhost:3000/**` + the Vercel domain), else confirmation falls back to Site URL and fails.

## Not yet done / next
- Optional: PWA manifest for installable mobile.
- If more questions are added, tag them (regenerate `question-topics.ts`) and seed the DB `questions` table (id/domain/difficulty are what matter).

_(Done: Supabase auth + per-user persistence, git remote, Vercel deploy, dark/light theme toggle (incl. in-session), topic-level strengths/weaknesses, weighted suggested set, streak leaderboard, editable exam date, 300 added questions + 30 "Choose three" (530 total; multi-answer option counts standardized to 4/5/6), in-session bionic reading mode + left review drawer (removed the jump-to-question palette), header attribution "by Lance Candelaria".)_

---

## Original brief (from Lance, for context)

> Create a website that will serve as my reviewer for my upcoming AWS SAA-C03 Exam (Solutions Architect Associate). Expectations:
> - Store my progress.
> - Two modes: **Reviewer** (tells the correct answer per question if answered incorrectly, green/red highlight); **Exam** (shows correct/wrong only at the end with final score).
> - Choose up to 65 questions (5 increments).
> - Adjustable time (default 2 hours per run).
> - Randomized items.
> - Pause the timer in both modes.
> - End screen: score, dropdown of questions with selected answers, highlighted corrected answers if wrong, duration, date.
> - History page for previous runs.
> - Analytics page (scores, time, consistency, scores per domain).
> - Easy / Medium / Hard difficulties.
> - A personalized home screen ("I'm Lance").
> - Web + mobile. Next.js. Local for now; git + database later.
> - Liked the Udemy results/history UI (donut + domain bars) as a reference.

The full in-scope SAA-C03 service list backing `lib/services.ts` is the AWS official list (Analytics, Application Integration, Cost Management, Compute, Containers, Database, Developer Tools, Front-End Web & Mobile, ML, Management & Governance, Media, Migration & Transfer, Networking & Content Delivery, Security/Identity/Compliance, Serverless, Storage).
