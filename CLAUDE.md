@AGENTS.md

# SAA-C03 Reviewer — Lance's personal AWS exam trainer

A Next.js app that helps Lance prepare for the **AWS Certified Solutions Architect – Associate (SAA-C03)** exam. Web + mobile (responsive). Local-first now; a Supabase database and git remote come later.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (note: this shadcn version is built on **Base UI** `@base-ui/react`, not Radix — `Button` has no `asChild`; use `buttonVariants` on a `<Link>`, or Base UI's `render` prop)
- **framer-motion** for motion, **zustand** (+ persist to `localStorage`) for state
- **lucide-react** icons

Design language ports the original single-file prototype: AWS-orange (`--brand #ff9900`) on ink, Space Grotesk / Inter / JetBrains Mono. Motion follows the Emil Kowalski + Impeccable skills (custom easings in `globals.css`, `transform`/`opacity` only, `prefers-reduced-motion` respected, short purposeful durations).

## Architecture

- `lib/questions.data.json` — **200 questions** (source of truth), extracted from the original `../aws-saa-c03-reviewer (2).html` prototype. Fields: `id, domain, difficulty, question, options[], answer (number | number[]), explanation, keyTakeaway`.
- `lib/questions.ts` — typed access, `DOMAIN_META`, `DIFFICULTY_META`, `PASS_PCT = 72`, `countAvailable()`.
- `lib/types.ts` — `Question`, `SessionConfig`, `ActiveSession`, `Attempt`, etc.
- `lib/session-utils.ts` — pure logic: `buildQuestionIds` (filter by difficulty/domain + shuffle), scoring (`isSelectionCorrect`, single & multi-answer), `finalizeAttempt`, timer math (`liveElapsed`, `remainingSec`), formatters.
- `lib/analytics.ts` — aggregates history into domain/difficulty mastery, score series, consistency, weakest domain.
- `lib/store.ts` — zustand store persisted to `localStorage` (`saa-reviewer-v1`): `settings`, resumable `active` session, `history`, global `flaggedIds`. Gate client UI on `useHydrated()` to avoid SSR mismatch.

### Routes
`/` home dashboard · `/practice` setup · `/session` runner (own chrome; nav hidden) · `/results/[id]` · `/history` · `/analytics` · `/flagged` · `/services` cheat-sheet.

## Domains & difficulty
Domains: `secure` (30%), `resilient` (26%), `performance` (24%), `cost` (20%). Difficulty: `easy | medium | hard`; setup filter also has **Mixed** (all). Difficulty is a **pool filter** (Hard = only hard questions), per Lance's choice.

## Product decisions (confirmed with Lance)
- Rebuild in Tailwind + shadcn (not a 1:1 CSS port).
- Difficulty = filter the pool.
- Study extras included: **flag/bookmark questions**, **service cheat-sheet**, **weak-domain focus mode**.
- Two modes: **Reviewer** (instant per-question feedback, green/red) and **Exam** (score + full review only at the end).
- Question count 5–65 in steps of 5; timer default 2h, adjustable, pausable in both modes; questions randomized; progress persisted; end screen shows score, per-question review dropdown with highlighted corrections, duration, date; history + analytics pages.

## Commands
```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build (also runs tsc + lint)
npm run lint
```

## Supabase
This project has a dedicated Supabase project. Use the **`Reviewer-supabase-mcp`** MCP server (user/global scope, connected) for all Supabase operations here — do **not** use the other `supabase-*` MCP servers (those are unrelated projects).
- **Project ref:** `uxyikqmonjhlhhalbvte` (URL `https://uxyikqmonjhlhhalbvte.supabase.co`)
- The MCP server is scoped to this ref and has write access (not read-only), so it can run migrations.

## Not yet done / next
- Supabase persistence (replace/augment the `localStorage` layer in `lib/store.ts`; keep the same shapes). Use the `Reviewer-supabase-mcp` server (see above).
- Git repo + remote.
- Optional: dark-mode toggle (tokens already defined in `globals.css`), PWA manifest for installable mobile.

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
