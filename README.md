# AI Project Manager: Meeting to Project CRM

Built for **The Infinity Hack '26** (AI Project Manager: Meeting to Execution).

A small project-management CRM for the fictional company NovaWorks Technologies. The administrator pastes a meeting transcript and clicks **Create from transcript**. An AI model reads it alongside the team directory and returns projects, tasks, managers, developers, deadlines and estimated hours. The app checks the whole result and saves it in one database transaction. Managers then see only their projects, and developers see only their own tasks.

> Items marked **TODO** must be filled in by the team before submission (names, links, deployment details).

## Team

- Team name: **Claude's Plan**
- Repository: https://github.com/Ab-Wb-Sid/AI-Project-Manager

| Member | Responsibility |
| --- | --- |
| Abdul Wahab | Data, authentication and access control |
| Saad Faisal | AI transcript pipeline |
| Ebbad ur Rehman | Frontend and integration |
| TODO: name | TODO: responsibility |

## What works

| Feature | Status |
| --- | --- |
| Seeded demo accounts (10 users, bcrypt-hashed passwords, safe to re-run) | Done |
| Login and logout with a signed, HTTP-only session cookie; generic error; login rate limit | Done |
| Admin home with all project cards (manager, deadline, task count, total hours) | Done |
| Create from transcript: live AI call, loading state, success summary, clear error messages | Done |
| All-or-nothing save (one database transaction; nothing saved if anything is invalid) | Done |
| Correction flow: unresolved fields shown with dropdowns, date and number inputs; "Check and save" revalidates without a new AI call and without losing the transcript | Done |
| Project detail with client, manager, deadline, description and task rows | Done |
| Manager view limited to their own projects | Done |
| Developer "My tasks" view, grouped by project with project name and manager | Done |
| Read-only team directory (names, roles, specializations; no emails) | Done |
| Role-based access enforced on direct API and page requests (out-of-scope projects return 404) | Done |
| Duplicate protection: button disabled while working, plus a server-side lock stored in the database (works across serverless instances) | Done |
| Projects and tasks persist after refresh and restart | Done |
| Responsive down to 360 px; keyboard and screen-reader friendly | Done |

Not included, by design: signup, forgot password, email verification, user management, cost calculation, progress monitoring and editing saved records.

Design documents: [`PRD.md`](PRD.md), [`Architecture.md`](Architecture.md), [`Design.md`](Design.md). Build log and decisions: [`PROGRESS.md`](PROGRESS.md).

## Technology stack

- **Frontend and backend:** Next.js 15 (App Router) with React 19, TypeScript and Tailwind CSS. One project, one deployment.
- **Database:** PostgreSQL (Supabase, Aiven or local), accessed with **Drizzle ORM** and `node-postgres`. Versioned SQL migrations live in `drizzle/`.
- **Validation:** Zod for the AI output shape, plus business rules checked against the database.
- **AI:** Anthropic Messages API, called only from the server. The model is set with `LLM_MODEL`. The app uses forced tool output so the reply always has the expected JSON shape. TODO: write the exact model you use.
- **Auth:** email and password checked against our own `users` table (bcrypt). An `iron-session` cookie (signed, HTTP-only, SameSite=Lax) stores only the user id. The role is re-read from the database on every request.

## Links

- Live application: TODO: URL, or "Not deployed"
- Demo video: TODO: recording URL (required if the database is local)

## Requirements

- Node.js 20 or newer and npm 10 or newer
- PostgreSQL 15 or newer: Supabase, Aiven or local
- An Anthropic API key (server only)

## Run locally

```sh
git clone https://github.com/Ab-Wb-Sid/AI-Project-Manager.git
cd AI-Project-Manager
npm install
cp .env.example .env        # then fill in the values (see the table below)
npm run db:migrate          # creates the tables
npm run seed                # creates the ten demo users; safe to re-run
npm run dev                 # http://localhost:3000
```

**Database options**

- **Local PostgreSQL:** `createdb novaworks`, then set both `DATABASE_URL` and `DIRECT_URL` to `postgresql://postgres:postgres@localhost:5432/novaworks`.
  Docker: `docker run --name novaworks-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=novaworks -p 5432:5432 -d postgres:16`
- **Supabase:** go to *Project Settings > Database*. Use the pooled string (port 6543) for `DATABASE_URL` and the direct string (port 5432) for `DIRECT_URL`. Add `?sslmode=require` to both.
- **Aiven:** use the service URI (it ends with `?sslmode=require`) for both variables.

## Environment variables

| Variable | Purpose | Where |
| --- | --- | --- |
| `DATABASE_URL` | Connection used by the app (pooled URL on Supabase) | `.env` locally; hosting dashboard when deployed |
| `DIRECT_URL` | Direct connection used by `npm run db:migrate` | `.env` |
| `SESSION_SECRET` | Signs the session cookie. At least 32 random characters | `.env` / hosting dashboard |
| `LLM_PROVIDER` | `anthropic` | `.env` / hosting dashboard |
| `LLM_API_KEY` | Anthropic API key. Never prefix with `NEXT_PUBLIC_` | `.env` / hosting dashboard |
| `LLM_MODEL` | Model name, for example a current Claude Sonnet model id | `.env` / hosting dashboard |
| `LLM_TIMEOUT_MS` | Maximum wait for the AI (default `60000`) | optional |
| `LLM_BASE_URL` | Optional API gateway URL (default `https://api.anthropic.com`) | optional |
| `HIDE_DEMO_ACCOUNTS` | Set to `true` to hide the click-to-fill demo list on the login page | optional |

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

`.env.example` contains placeholders only. `.env` is in `.gitignore`. No secret is ever sent to the browser, and passwords and emails are never sent to the AI.

## Demo login accounts

Fictional identifiers, not real mailboxes. Run `npm run seed` first. All ten accounts work with the password below (covered by the integration tests).

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik | hina@novaworks.example | Demo123! |
| Developer | Ali Raza | ali@novaworks.example | Demo123! |
| Developer | Hamza Shah | hamza@novaworks.example | Demo123! |
| Developer | Sara Noor | sara@novaworks.example | Demo123! |
| Developer | Usman Tariq | usman@novaworks.example | Demo123! |
| Developer | Zain Abbas | zain@novaworks.example | Demo123! |
| Developer | Maryam Asif | maryam@novaworks.example | Demo123! |

The login page lists these accounts; clicking one fills the form.

## How judges can test

1. Log in as **admin** and click **Create from transcript**.
2. Paste the supplied transcript. It is in the repository at [`docs/sample-transcript.txt`](docs/sample-transcript.txt).
3. Click **Create from transcript** and wait 10 to 60 seconds. Expect **3 projects and 12 tasks**.
4. Open **UrbanCart Website**: manager Ayesha Khan, deadline 20 Oct 2026, four tasks (Ali 12 h, 8 h, 6 h; Hamza 14 h).
5. Log out and log in as **Ayesha**: only UrbanCart appears, and there is no transcript option.
6. Log in as **Ali**: My tasks shows only his three UrbanCart tasks (26 hours).
7. Log in as **Hamza**: two tasks, one in UrbanCart and one in QuickServe.
8. As Ali, open another project's URL directly, for example `/projects/<QuickServe id>` or `GET /api/projects/<id>`. It shows "Project not found" and returns 404 with no data.
9. Refresh: everything is still there.
10. **Changed input:** reset (below), then paste [`docs/sample-transcript-changed.txt`](docs/sample-transcript-changed.txt). There, QuickServe's "Mobile integration and testing" is 12 hours, due 23 October. Only that task changes.
11. **Correction flow:** replace "Maryam owns Assistant evaluation and testing" in the recap with "Kamran owns …". The AI should refuse to assign Kamran. If a person or date cannot be resolved, the result pane says "Nothing was saved" and shows the field with a dropdown. Choose a developer, then click **Check and save**.

**Expected result for the supplied transcript**

| Project | Manager | Deadline | Tasks | Hours |
| --- | --- | --- | --- | --- |
| UrbanCart Website | Ayesha | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina | 2026-10-22 | 4 | 38 |

Also check: no payment, inventory, maps or real-email tasks; Kamran is not assigned anything; Maryam owns Assistant evaluation and testing.

**Reset generated projects and tasks between tests (users are kept)**

```sh
npm run reset:demo
```

## Tests

| Command | What it covers | Needs |
| --- | --- | --- |
| `npm test` | Unit: Zod shape, date rules, task-after-project-deadline, manager/developer role checks, hours limits, duplicate titles, JSON extraction, prompt contains no answer-key values, rate limit | nothing |
| `npm run test:integration` | Real database: seed re-run, all 10 logins, generic login error, admin-only creation, empty transcript, 3/12 save, rollback on invalid draft and on a mid-transaction DB error, correction mode, AI failure, malformed output, concurrent 409, every role's scoped reads, 404 for out-of-scope projects, no leaked fields | PostgreSQL in `TEST_DATABASE_URL` |
| `npm run test:e2e` | Playwright, through the browser: login error, admin create 3/12, Ayesha, Ali (and direct-URL denial), Hamza, changed transcript, correction flow, AI failure, team page | PostgreSQL; uses a local fake model server, no API key |
| `npm run test:ai` | **Live** AI regression against the organizer answer key (all 12 tasks and the traps). Add `-- docs/sample-transcript-changed.txt --changed` for the changed-input test | `LLM_API_KEY`, `LLM_MODEL` |

The end-to-end tests use `tests/e2e/fake-llm.mjs`, a test-only stand-in for the Anthropic API. It reads the recap lines of whatever transcript it is sent. The app itself always calls the real model. `npm run test:ai` is the check that the real model gets the answer key right.

## Deployment

- Deployment status: TODO: Live / Local only
- App host: TODO: Vercel URL
- Backend: same deployment (Next.js route handlers)
- Database: TODO: Supabase or Aiven PostgreSQL (no credentials listed here)
- Deployed branch and commit: TODO

### How to deploy (Vercel and Supabase)

1. Create a Supabase project. Copy the pooled connection string (port 6543) and the direct string (port 5432), adding `?sslmode=require` to both.
2. Import the GitHub repository into Vercel. Framework preset: Next.js. Build command: `npm run build`. No output directory setting is needed.
3. In Vercel, add the environment variables `DATABASE_URL` (pooled), `DIRECT_URL`, `SESSION_SECRET`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL` and `LLM_TIMEOUT_MS`.
4. From your machine, with the hosted values in `.env`, create the tables and users:

   ```sh
   npm run db:migrate
   npm run seed
   ```
5. Deploy. The transcript route sets `maxDuration = 60` so the AI call can finish. On the Vercel Hobby plan, the maximum is 60 seconds.
6. Open the live URL, log in as admin and run the transcript once to confirm.

There is no separate backend service and no cross-origin setup: the browser and the API share one origin.

## Known limitations

- Saved projects and tasks cannot be edited or deleted from the UI (optional in the brief). `npm run reset:demo` clears them.
- AI extraction is probabilistic. Validation catches unknown people, wrong roles, bad dates, task dates after the project deadline and non-positive hours. A plausible but wrong value still needs a human check against the transcript.
- Conversion takes 10 to 60 seconds. If the AI is slow, down, or out of quota, the app shows an error and saves nothing; try again.
- The login rate limit is kept in memory, so it is per server instance. The conversion lock is in the database and works across instances.
- TODO: add any cold-start or hosting limits that apply to your deployment.

## Submission summary

- Source repository: https://github.com/Ab-Wb-Sid/AI-Project-Manager
- Live link or demo video: TODO
- Setup: `npm install`, `npm run db:migrate`, `npm run seed`, `npm run dev`
- Demo accounts: listed above (all ten covered by tests)
- Features completed: everything in "What works"
