# PROGRESS

Build log for the NovaWorks AI Project Manager. Update at the end of every work session so anyone can resume.

_Last updated: 7 Oct 2026 (branch `ebbad`)_

## Status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Scaffold, Tailwind tokens, fonts, `.env.example`, `docs/sample-transcript.txt` | Done |
| 1 | Schema, migration, idempotent seed, `reset:demo` | Done |
| 2 | Login, logout, session, `getCurrentUser`, rate limit, page guards | Done |
| 3 | Role-scoped data layer and read APIs | Done, tested |
| 4 | AI pipeline: prompt, client, Zod schema, validator, transaction, duplicate lock, `POST /api/transcript/create` | Done, tested with a fake model |
| 5 | Frontend: app shell, login, role homes, project cards, detail, My tasks, team, not-found | Done |
| 6 | Transcript workspace: working, success, AI-error, needs-correction | Done |
| 7 | Hardening: empty/error states, responsive (360/768/1280 checked), accessibility basics | Done |
| 8 | Test suites | Unit, integration, e2e green. **Live AI test not run yet** (no API key in the build environment) |
| 9 | Deployment and final README | README done. **Deployment not done** |
| 10 | Optional extras (editing, deadline rail) | Not started |

## Test results (last run)

- `npm test`: 19/19 passed
- `npm run test:integration`: 20/20 passed (local PostgreSQL 16)
- `npm run test:e2e`: 9/9 passed (Chromium, production build, fake model server)
- `npm run lint`, `npm run typecheck`, `npm run build`: clean
- `npm run test:ai` (live model): **not run**. Needs `LLM_API_KEY`. Run it, and the `--changed` variant, before the demo.

## Next steps

1. Put a real `LLM_API_KEY` and `LLM_MODEL` in `.env`. Run `npm run test:ai` three times, then `npm run test:ai -- docs/sample-transcript-changed.txt --changed`. If a trap fails, tighten the matching generic rule in `src/lib/ai/prompt.ts`; never hard-code answers.
2. Deploy (README → Deployment), seed the hosted database, and fill in the README TODOs (team member 4, model name, links).
3. Record the demo video following PRD §10.

## Decisions made

- **Drizzle ORM instead of Prisma.** Prisma's engine binaries could not be downloaded in the build environment, so it could not be run or tested there. Drizzle is pure JavaScript, is listed as an option in `Architecture.md`, and works well with Supabase's pooler on Vercel. Tables: `users`, `projects`, `tasks`, `conversion_locks`. Migrations are in `drizzle/`.
- **Fonts** come from `@fontsource-variable/*` npm packages (self-hosted) instead of `next/font/google`, so builds never need Google Fonts network access.
- **Tailwind v3** with every token in `tailwind.config.ts` and the colour values as CSS variables in `src/app/globals.css`.
- **The AI output is forced** through an Anthropic tool (`save_project_plan`) with a JSON schema. Code-fence stripping stays as a fallback. Temperature 0, retrying without temperature if a model rejects it.
- **The transcript is wrapped in delimiters** and the prompt calls it untrusted data (prompt-injection hardening). The prompt contains no answer-key values (a unit test enforces this).
- **The validator collects every issue** at once. Beyond the brief, it also flags duplicate task titles in one project, hours above 400, and dates outside 2026.
- **The duplicate-submission lock is a database row** (`conversion_locks`), not an in-memory set, so it works across serverless instances. It is treated as stale after 3 minutes.
- **The transaction re-checks the people's roles** inside itself before inserting, and the database also enforces `estimated_hours > 0`.
- **The app generates project and task ids** with `crypto.randomUUID()`; the model never supplies ids.
- **Out-of-scope projects return the same 404** as missing ones, on both the API and the page.
- **Project colour** comes from global creation order (the same for every viewer). `created_at` is staggered within a save so the meeting's project order is kept.
- **Agents' project cards and counts** include only their own tasks.
- **Agents' home is `/my-tasks`.** Admin and managers use `/`.
- **The demo-accounts box** shows on the login page unless `HIDE_DEMO_ACCOUNTS=true`.
- **End-to-end tests use a fake model server** (`tests/e2e/fake-llm.mjs`, test only), reached through `LLM_BASE_URL`. The app has no built-in fake or prefilled answer.

## Known issues

- None known in the tested paths.
- The live model has not been run against the answer key from here (see Next steps).
- The login rate limit is in memory, so it is per instance.

## Layout

```
drizzle/                      SQL migrations
docs/                         sample transcript and changed transcript
scripts/                      seed, reset, live AI test
src/lib/db/                   Drizzle schema and client
src/lib/access/               role-scoped reads (the only place projects and tasks are queried)
src/lib/ai/                   prompt, Anthropic client, Zod shape, validator
src/lib/services/             auth and transcript services (transaction, lock)
src/app/api/                  thin route handlers
src/app/(app)/                signed-in pages; src/app/login
src/components/               AppBar, ProjectCard, TaskTable, TranscriptWorkspace, ui
tests/unit, tests/integration, tests/e2e
```
