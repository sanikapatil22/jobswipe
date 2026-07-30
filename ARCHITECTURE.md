# SwipePrep — Architecture Design Document (Reconciled)

**Status:** Engineering Review — supersedes the original draft
**Reality check:** the uploaded repo is an **AI Studio prototype** — Vite + React 19 + Express + `@google/genai`, in-memory data, no auth, no DB, no queue. The original draft describes a *different* target stack (Next.js + Prisma/Postgres + Better Auth + UploadThing). This document is the production architecture for that target, with the gaps in the original draft fixed and a migration path from the current prototype called out explicitly.

---

## 0. What Changed From the Draft, and Why

| # | Draft said | Problem | Fix |
|---|---|---|---|
| 1 | `Application.status: Status` with no enum/relations defined | Won't compile — `Status` type doesn't exist; no `@relation`, no `@@unique`, no indexes | Full schema in §7 with enums, FKs, composite unique constraints, indexes |
| 2 | "Edge Functions for streaming AI responses" + "Database-session based" auth | Edge runtime can't reliably read Node-based DB sessions on every request the same way; Gemini roadmap generation (4 steps, structured JSON) is 5–20s — too slow for a request/response Edge function, and will hit Vercel's execution limits under load | Long AI jobs run as **background jobs** (queue + worker), not inline Edge calls. Only the **chat/mentor** feature streams (Node runtime, not Edge, since it needs the DB session) |
| 3 | "RLS via Prisma/Postgres logic" | Prisma doesn't enforce RLS — it's an ORM. Native Postgres RLS requires session-level `SET` per request, which Prisma's pooled connections don't do by default | Enforce isolation at the **application layer**: every query scoped by `userId` from the session, never trust client-supplied IDs. Real Postgres RLS is optional/defense-in-depth (§18) using Prisma's `$executeRaw` + a per-request Postgres role if you want belt-and-suspenders |
| 4 | Server Actions doing "AI prompt engineering" directly | Ties web request lifecycle to AI latency + cost; a burst of resume uploads could tie up serverless function instances and blow the Gemini budget | Split into **thin Server Action → enqueue job → worker calls Gemini → webhook/poll updates DB**. Prompts live in `/lib/gemini`, but execution is decoupled from the request |
| 5 | No mention of idempotency on `handleSwipe` | Double-swipe (bad network retry) creates duplicate `Application` rows | `@@unique([userId, jobId])` on `Application` + upsert semantics |
| 6 | Gemini "1.5 Flash / 1.5 Pro" | Model naming — verify current model IDs against Google's docs at build time; don't hardcode a specific snapshot in prompts/config, keep it in env | Model ID centralized in `lib/gemini/config.ts`, overridable via env var |
| 7 | Resume "sandboxed environment" parsing, unspecified | No actual isolation mechanism named | PDF text extraction happens in the **worker process**, not the web server; worker has no access to other users' data at the OS/process level; output length/size capped before hitting Gemini |

---

## 1. System Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Next.js (Node)   │────▶│   PostgreSQL    │
│  (App Router)│◀────│  Route Handlers /  │◀────│   (Neon)        │
└─────────────┘     │  Server Actions    │     └─────────────────┘
                     └──────────────────┘
                              │
                     enqueue  │  (thin, fast, returns immediately)
                              ▼
                     ┌──────────────────┐     ┌─────────────────┐
                     │   Job Queue        │────▶│  Worker(s)       │
                     │ (Vercel Queue /     │     │ (Node, long-     │
                     │  Upstash QStash /   │     │  running, calls  │
                     │  BullMQ+Redis)      │     │  Gemini)         │
                     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────────┐
                                                 │   Gemini API     │
                                                 └─────────────────┘
```

**Key principle:** the web tier never blocks on an AI call longer than a couple seconds. Anything that calls Gemini for a multi-step structured output (roadmap generation, resume parsing) is a **background job**; only the low-latency, single-turn "why you match" and the mock-interview **chat** happen inline/streamed.

---

## 2–6. PRD, User Journey, IA, Component Hierarchy

Unchanged from the draft — these are product-level decisions and are sound. One addition:

- **Loading/optimistic states are now first-class, not implied.** Because roadmap generation is async (§0.2/0.4), `Application.roadmapStatus` must be surfaced in the UI (`PENDING → GENERATING → READY → FAILED`) so `CompanyPrepCard` can show a real state instead of assuming the roadmap is already there.

### Updated Folder Structure

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── discover/
│   │   ├── companies/
│   │   │   └── [id]/
│   │   ├── resume/
│   │   └── profile/
│   ├── api/
│   │   ├── uploadthing/route.ts       # UploadThing callback
│   │   ├── webhooks/gemini-job/route.ts  # worker → app callback (job done)
│   │   └── auth/[...all]/route.ts     # Better Auth handler
├── components/
├── hooks/
├── lib/
│   ├── gemini/
│   │   ├── config.ts                  # model IDs, env-driven
│   │   ├── prompts/                   # one file per prompt template
│   │   └── schemas.ts                 # Zod schemas AI output is validated against
│   ├── queue.ts                       # enqueue() abstraction
│   ├── prisma.ts
│   └── rate-limit.ts
├── server/
│   ├── actions/                       # thin Server Actions (validate + enqueue + return)
│   └── jobs/                          # worker entrypoints (resume-parse, roadmap-gen, match)
├── store/
└── types/
```

---

## 7. Database Schema (Corrected)

```prisma
enum ApplicationStatus {
  SAVED
  DISCARDED
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
}

enum RoadmapStatus {
  PENDING
  GENERATING
  READY
  FAILED
}

enum WorkType {
  REMOTE
  HYBRID
  ONSITE
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  resumeUrl     String?
  atsScore      Int?
  skills        String[]      @default([])
  targetRoles   String[]      @default([])
  preferences   Json          @default("{}")
  applications  Application[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Better Auth relations
  sessions      Session[]
  accounts      Account[]

  @@index([email])
}

model Job {
  id            String        @id @default(cuid())
  companyName   String
  companyLogo   String?
  role          String
  description   String
  requirements  String[]      @default([])
  salary        String?
  location      String
  workType      WorkType      @default(ONSITE)
  companySize   String?
  deadline      DateTime
  applyUrl      String
  tags          String[]      @default([])
  isActive      Boolean       @default(true)
  applications  Application[]
  createdAt     DateTime      @default(now())

  @@index([isActive, deadline])
  @@index([tags])
}

model Application {
  id             String            @id @default(cuid())
  userId         String
  jobId          String
  status         ApplicationStatus @default(SAVED)
  matchScore     Int?
  whyYouFit      String?
  roadmap        Json?
  roadmapStatus  RoadmapStatus     @default(PENDING)
  notes          String?
  appliedAt      DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  job            Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])   // prevents duplicate swipe-applications
  @@index([userId, status])
  @@index([userId, roadmapStatus])
}
```

Notes:
- `@@unique([userId, jobId])` turns `handleSwipe` into a safe upsert — retries can't create duplicates.
- `roadmap` stays `Json` (schema-on-read via Zod, not a rigid relational model — the AI output shape can evolve without migrations).
- Better Auth's own `Session`/`Account` models are generated by its Prisma adapter — don't hand-rewrite them; run its schema generator and keep `User` as the shared table.

---

## 8. API Architecture (Corrected)

| Layer | Used for | Runtime |
|---|---|---|
| Route Handlers | UploadThing callback, Better Auth handler, worker→app webhook | Node |
| Server Actions | `handleSwipe`, `updateProfile`, `enqueueRoadmap`, `enqueueResumeParse` — all **thin**: validate input (Zod) → write/enqueue → return immediately | Node |
| Worker (queue consumer) | `parseResume`, `generateRoadmap`, `computeMatchScore` — the actual Gemini calls, with retry/backoff | Node (Vercel Queue function, or a small always-on worker if job volume grows past serverless limits) |
| Streaming route | `AIInterviewer` mock-interview chat only | Node (not Edge — needs DB session + Prisma) |

```
handleSwipe(jobId, direction)
  → if RIGHT: upsert Application(status=APPLIED), redirect client to job.applyUrl
  → if RIGHT: enqueue('generate-roadmap', { applicationId })   // fire-and-forget
  → returns immediately; UI shows roadmapStatus = GENERATING

generateRoadmap (worker)
  → fetch Application + Job + User
  → call Gemini with prompt from lib/gemini/prompts/roadmap.ts
  → validate response against Zod schema (schemas.ts) — reject/retry once if invalid
  → write roadmap JSON + roadmapStatus=READY (or FAILED) to DB
  → (optional) POST to /api/webhooks/gemini-job to trigger a client revalidation via a lightweight pub/sub (or just let React Query poll while status=GENERATING)
```

**Client polling pattern:** React Query polls `Application.roadmapStatus` every 2–3s only while `GENERATING`, then stops — cheap and avoids needing WebSockets for v1.

---

## 9. Authentication Flow

- **Provider:** Better Auth, Prisma adapter.
- **Strategy:** Google OAuth (MVP) + GitHub, magic link as fallback.
- **Sessions:** Database-backed (not JWT) — deliberate, since it lets you revoke sessions and matches the "Node runtime everywhere that touches the DB" decision above. This also removes the earlier Edge/session mismatch.
- **Middleware:** `middleware.ts` protects `/discover`, `/companies`, `/resume`, `/profile`; redirects unauthenticated users to `/login`. Runs in Node (or Edge with only a lightweight cookie-presence check, deferring the actual session validity check to the page/layout) — do not do a full DB session lookup in Edge middleware on every request; that's the performance trap the draft's "Edge Functions" language was flirting with.

---

## 10. AI Architecture (Corrected)

| Step | Trigger | Sync or Async | Model class* |
|---|---|---|---|
| Resume parsing | On upload | **Async job** | fast/flash-tier |
| Match score + "why you fit" | On job card render (batch top-10, not per-swipe) | Computed **at job-fetch time for the discover feed**, cached — not recomputed per render | fast/flash-tier |
| Roadmap generation | On right-swipe | **Async job** | flash-tier for structure, escalate to pro-tier only if flash output fails schema validation |
| Mock interviewer | User sends chat message | **Sync, streamed** | pro-tier |

*Verify exact current Gemini model IDs against Google's docs at implementation time — don't hardcode a model snapshot name in this doc; keep it in `lib/gemini/config.ts` behind an env var so it can be bumped without a code change.

**All structured AI output is validated with Zod before it touches the DB.** If `generateContent` returns malformed JSON or fails the schema, retry once with a stricter prompt, then mark `roadmapStatus=FAILED` and surface a "Retry" button — never write partial/invalid JSON to `roadmap`.

**Prompt injection surface:** resume text and job descriptions are both partially user/external-supplied. Wrap them in clearly delimited blocks in the prompt (as the prototype already does with `"""..."""`), strip any text that looks like an instruction override (`ignore previous instructions`, etc.) before interpolation, and never let AI output control which DB rows get written beyond the single record it was invoked for.

---

## 11–13. State Management, Folder & Page Responsibilities

Unchanged from the draft, with one addition: **Zustand also owns `roadmapStatus` transitions optimistically** (set to `GENERATING` the instant a swipe-right happens, before the server confirms) so the UI never shows a stale `PENDING` state.

---

## 14. ERD Summary

```
User (1) ──< Application >── (1) Job
User (1) ──< Session
User (1) ──< Account
```

`Application` carries the roadmap directly (no separate `AIRoadmap` table) — it's 1:1 by construction, so a join table adds nothing but complexity. If roadmap **versioning** becomes a requirement (regenerate + compare), split it out then, not now.

---

## 15–17. Feature Priorities, MVP Scope, Future Features

Unchanged — reasonable as scoped. One MVP addition: **`roadmapStatus` UI states** must ship in P0, not be an afterthought, since roadmap generation is async from day one under this architecture.

---

## 18. Security Considerations (Corrected)

- **Data isolation:** enforced in application code — every Prisma query for `Application`/user data includes `where: { userId: session.user.id }`. Never accept a client-supplied `userId`. Optionally harden further with real Postgres RLS policies (`ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY`) combined with a `SET LOCAL app.user_id` per transaction if you want defense-in-depth — but this is additive, not a substitute for correct query scoping.
- **Prompt injection sanitization:** delimiter-wrapping + instruction-override stripping, as above.
- **Rate limiting:** per-user daily caps on resume uploads and roadmap generations, enforced at the Server Action layer (before enqueueing) using Upstash Redis or a Postgres counter table — not just "at the API" in the abstract.
- **File validation:** UploadThing config restricts to `application/pdf`, size cap (e.g., 5MB); worker re-validates MIME type before extraction.

---

## 19. Performance Considerations

- **Optimistic UI:** swipe animates instantly (Zustand); `Application` upsert + roadmap enqueue happen in the background; on failure, roll back the swipe and toast an error.
- **Card rendering:** `framer-motion`/`motion` for the stack; render only the top 2–3 cards, not the full 10-job batch, to keep DOM light.
- **Caching:** job feed cached at the edge (Vercel Data Cache) with a short revalidate window; match scores computed once per job-per-user and cached on read, not recomputed on every discover-tab visit.

---

## 20. Deployment Architecture

- **App:** Vercel (Next.js).
- **DB:** Neon Postgres, pooled via Prisma's connection pooling (`pgbouncer` mode) — required once you have a queue worker + web tier both hitting the DB.
- **Queue:** Vercel Queue (if staying fully on Vercel) or Upstash QStash / Redis+BullMQ if you need a longer-running worker outside serverless limits.
- **Storage:** UploadThing for resumes.
- **Observability:** Vercel Analytics for swipe/conversion funnels; a structured log (Axiom) specifically on the job queue — job latency, failure rate, and Gemini token spend per job type, since that's the actual cost/reliability risk surface in this system.

---

## 21. Migration Path From the Current Prototype

The uploaded repo (`Vite + Express + @google/genai`, in-memory arrays, `gemini-3.6-flash`, no auth) is a useful **prompt/UX reference implementation** — the four Gemini prompts in `server.ts` (parse-resume, match-analysis, generate-roadmap, mock-interview) can be lifted almost directly into `lib/gemini/prompts/`. What needs to change to reach the architecture above:

1. Move off Express/Vite dev server → Next.js App Router.
2. Replace in-memory `jobsData` / `userApplications` arrays → Prisma models (§7).
3. Add Better Auth (currently zero auth — every request in the prototype acts as `user_default`).
4. Move the four `app.post('/api/ai/...')` handlers from synchronous request handlers → background jobs behind a queue (§8, §10), keeping only the mock-interview chat synchronous/streamed.
5. Add Zod validation on every Gemini JSON response (prototype currently trusts `JSON.parse(response.text)` with no schema check, and falls back to hardcoded fake `feedback` in the mock-interview route on parse failure — that fallback pattern needs to become an explicit `FAILED` state instead of silently returning fabricated data).
6. Add per-user rate limiting on the AI routes (currently unlimited).