# SwipePrep

**The fastest way for students to discover, apply to, and prepare for internships and jobs.**

Production architecture: Next.js App Router + Prisma/PostgreSQL (Neon) + Better Auth + UploadThing + Gemini background jobs. See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS v4, `lucide-react`, `motion`
- **Data:** Prisma 7 + PostgreSQL (Neon), `@prisma/adapter-pg`
- **Auth:** Better Auth (email/password + optional Google/GitHub OAuth)
- **AI:** Google Gemini via `@google/genai` (async jobs for resume/roadmap/match; streamed mock interview)
- **Uploads:** UploadThing (PDF resumes)
- **Client state:** TanStack Query + Zustand
- **Forms:** React Hook Form + Zod
- **Jobs:** Queue abstraction (HTTP self-invoke locally; Upstash QStash when configured)

## Project structure

```text
src/
├── app/
│   ├── (auth)/login|signup
│   ├── (dashboard)/discover|companies|resume|profile
│   └── api/auth|uploadthing|workers|webhooks|ai/mock-interview
├── components/
├── lib/gemini|auth|prisma|queue|rate-limit|uploadthing
├── server/actions|jobs|queries
├── store/
└── types/
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Setup

1. Copy env file and fill values:
   ```bash
   cp .env.example .env
   cp .env.example .env.local
   ```
2. Set `DATABASE_URL` to your Neon Postgres connection string.
3. Set `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`, and `WORKER_SECRET`.
4. Install & migrate:
   ```bash
   npm install
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Start:
   ```bash
   npm run dev
   ```

Optional: `UPLOADTHING_TOKEN`, OAuth client IDs/secrets, `QSTASH_TOKEN`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run build` | Prisma generate + Next.js production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed job listings |

## Feature map

| Feature | Implementation |
|---|---|
| Job discovery / swipe | `/discover` + `handleSwipe` Server Action |
| My Companies | `/companies` + `/companies/[id]` |
| Resume parse | UploadThing + `enqueueResumeParse` background job |
| Match analysis | Heuristic on feed + `compute-match` background job |
| AI roadmap | `enqueueRoadmap` background job + React Query polling |
| Mock interview | Streaming `POST /api/ai/mock-interview` |
| Profile | `/profile` + `updateProfile` |

## Deploy (Vercel)

1. Link the project and set all env vars from `.env.example`.
2. Use Neon pooled `DATABASE_URL`.
3. Deploy — `postinstall` runs `prisma generate`; run `prisma migrate deploy` in the build command or as a release step:

```bash
prisma migrate deploy && prisma generate && next build
```
