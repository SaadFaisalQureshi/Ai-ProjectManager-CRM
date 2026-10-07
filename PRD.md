# PRD: AI Project Manager — Meeting to Execution

**Event:** The Infinity Hack '26
**Company scenario:** NovaWorks Technologies, Lahore, Pakistan
**Team size:** 4 participants | **Build time:** 3 hours
**Document status:** v1.0 (MVP)

---

## 1. Overview

### 1.1 Product summary
A lightweight Project Management CRM for NovaWorks Technologies. The administrator pastes a meeting transcript into the app, clicks **Create from Transcript**, and an AI model converts the discussion into real, saved records: projects, tasks, assigned managers and developers, deadlines, and estimated hours. Managers and developers then log in and see only the work they are permitted to see.

### 1.2 Core flow
```
Login → Paste meeting transcript → AI extracts projects & tasks
      → Validate (all-or-nothing) → Save → View projects & assigned tasks
```

### 1.3 Problem
After a planning meeting, someone has to manually re-enter project names, owners, deadlines, and estimates into a tracker. This is slow, error-prone, and ignores corrections made during the meeting (revised dates, changed owners, rejected features).

### 1.4 Solution
Use an LLM, given the full transcript plus the company team directory, to produce a structured draft that the application validates and saves transactionally. The AI must follow **final agreed decisions**, ignore **rejected features**, and only reference **existing users**.

---

## 2. Goals and Non-Goals

### 2.1 Goals
1. A working end-to-end meeting-to-project flow powered by a real AI call (not a prefilled answer).
2. Simple, secure login with three roles: Admin, Manager, Agent.
3. Role-based access enforced **server-side on every data request**, not just by hiding UI.
4. Persistent storage so records survive refresh/restart.
5. A clear, usable frontend: project cards, project detail, task rows, My Tasks, team directory.
6. Correct extraction of the supplied transcript: **3 projects, 12 tasks** matching the organizer answer key.

### 2.2 Non-Goals (explicitly out of scope)
- Signup, forgot password, email verification, email sending
- User-management screens (create/edit/delete users)
- Cost calculation, hourly rates, budgets
- Progress monitoring, completion %, charts, timesheets
- Management-hour estimates (developer work only)
- Editing created projects/tasks (optional stretch only)

---

## 3. Users and Roles

| Role | Count | Capabilities |
|---|---|---|
| **ADMIN** | 1 | See all projects; see all tasks; use Create from Transcript; view team directory |
| **MANAGER** | 3 | See only projects where `managerId == self`; see all tasks in those projects; view team directory |
| **AGENT** | 6 | See only tasks assigned to self; see related project name and manager; never see other agents' tasks; view team directory |

### 3.1 Demo accounts (fictional; seeded)
All passwords: `Demo123!` (stored hashed).

| Ref | Name | Email | Role | Specialization | Skills |
|---|---|---|---|---|---|
| ADMIN | Admin | admin@novaworks.example | ADMIN | Administrator | Company overview, transcript creation |
| PM01 | Ayesha Khan | ayesha@novaworks.example | MANAGER | Web PM | Web projects, client coordination |
| PM02 | Bilal Ahmed | bilal@novaworks.example | MANAGER | Mobile PM | Mobile projects, delivery planning |
| PM03 | Hina Malik | hina@novaworks.example | MANAGER | AI PM | AI projects, requirement review |
| DEV01 | Ali Raza | ali@novaworks.example | AGENT | Full-Stack | React, frontend integration |
| DEV02 | Hamza Shah | hamza@novaworks.example | AGENT | Full-Stack | Node.js, databases, APIs |
| DEV03 | Sara Noor | sara@novaworks.example | AGENT | App Developer | Flutter, mobile UI |
| DEV04 | Usman Tariq | usman@novaworks.example | AGENT | App Developer | Flutter, integration, testing |
| DEV05 | Zain Abbas | zain@novaworks.example | AGENT | AI Developer | LLMs, extraction, prompts |
| DEV06 | Maryam Asif | maryam@novaworks.example | AGENT | AI Developer | Retrieval, document processing |

---

## 4. Functional Requirements

### 4.1 Authentication
- **FR-A1** Email + password login using the seeded accounts.
- **FR-A2** Logout.
- **FR-A3** Invalid credentials return a generic "invalid credentials" error.
- **FR-A4** Current user is derived **from the session** — never from a caller-supplied role or user ID.
- **FR-A5** After login, route the user to the home screen for their role.
- **FR-A6** Passwords are hashed (e.g., bcrypt/argon2) before storage and **never sent to the AI**.

### 4.2 Seeding
- **FR-S1** A seed command inserts the ten demo users using **upsert by unique email**.
- **FR-S2** Re-running the seed must **not** create duplicates.
- **FR-S3** Seed stores: name, email, passwordHash, role, specialization, skills.
- **FR-S4** Seeded user IDs (e.g., `PM01`, `DEV01`) are the same IDs used in the AI directory and saved assignments.

### 4.3 Screens

| # | Screen | Who | Contents |
|---|---|---|---|
| 1 | Login | All | Email, password, error state |
| 2 | Admin Home | Admin | All project cards + **Create from Transcript** entry |
| 3 | Create from Transcript | Admin | Large textarea, submit button, loading/success/error/validation-issue states |
| 4 | Team Directory | All logged-in | Read-only: names + specializations |
| 5 | Projects List | Admin / Manager / Agent (scoped) | Project cards: name, client, manager, deadline, task count |
| 6 | Project Detail | Scoped | Client, manager, deadline, description, task rows |
| 7 | Task Row | Scoped | Title, description, assigned agent, deadline, estimated hours |
| 8 | My Tasks | Agent | Own assigned tasks with parent project name + manager |

### 4.4 Role-scoped data access

```
getProjects(currentUser):
  ADMIN   -> all projects
  MANAGER -> projects where managerId == currentUser.id
  AGENT   -> distinct projects containing their assigned tasks

getTasks(currentUser, projectId):
  ADMIN   -> all tasks in projectId
  MANAGER -> all tasks only if they manage projectId
  AGENT   -> only tasks assigned to them in projectId

getProjectById(currentUser, projectId):
  reject if project not in getProjects(currentUser)
  return project + getTasks(currentUser, projectId)
```

- **FR-R1** Rules apply to **direct API/data requests** (e.g., hitting `/api/projects/:id` by URL), not only list screens.
- **FR-R2** Unauthorized access returns 403/404 with no data leakage.
- **FR-R3** An agent sees the related project name and manager, but never other agents' tasks.
- **FR-R4** Only ADMIN can call transcript creation.

### 4.5 Transcript automation (Create from Transcript)

**Pipeline**
1. Verify session user is ADMIN; else reject (403).
2. Reject empty/whitespace-only transcript.
3. Build directory from DB: `id, name, role, skills` (**no passwords/hashes/emails needed**).
4. Call LLM with: transcript, directory, expected JSON output shape, and instructions.
5. Parse the response as JSON; validate the **entire** draft before saving anything.
6. If valid → save all projects + tasks in **one DB transaction**; generate application IDs.
7. If invalid → save nothing; show unresolved fields; allow correction and revalidation.
8. Show created projects and task counts.

**Validation rules**

| Level | Rule |
|---|---|
| Project | `name`, `clientName` required; `deadline` valid `YYYY-MM-DD`; `managerId` exists and role == MANAGER |
| Task | `title` required; `assigneeId` exists and role == AGENT; `estimatedHours` > 0; `deadline` valid date and **<= project deadline** |
| Draft | Valid JSON matching the output shape; at least one project |

**AI behavior requirements**
- **FR-T1** Follow **final** decisions; later corrections override earlier statements.
- **FR-T2** Ignore rejected features (payments, inventory, maps, driver tracking, real emails, separate native Android/iOS tasks).
- **FR-T3** Use only existing users; never invent an employee. People mentioned who aren't employees (e.g., **Kamran**) must not be added or assigned work.
- **FR-T4** Keep distinct tasks distinct, even with the same owner (e.g., Hamza's two API tasks stay separate).
- **FR-T5** Estimates are developer effort hours, not calendar days.
- **FR-T6** Unclear required info → do not guess; surface for correction.

**Reliability requirements**
- **FR-T7** Disable the button and show loading state while processing (prevents duplicate submissions).
- **FR-T8** AI failure, timeout, or malformed output → understandable error, **no partial records**.
- **FR-T9** Application code generates project/task IDs; the model only returns content and existing user references.

### 4.6 AI output contract

```json
{
  "projects": [
    {
      "name": "Extracted project name",
      "clientName": "Extracted client",
      "description": "Extracted scope",
      "managerId": "PM01",
      "deadline": "2026-10-20",
      "tasks": [
        {
          "title": "Extracted task",
          "description": "Extracted task scope",
          "assigneeId": "DEV01",
          "deadline": "2026-10-12",
          "estimatedHours": 12
        }
      ]
    }
  ]
}
```

> Tip: use the provider's structured-output / JSON mode if available, set `temperature` low (0–0.2), and still strip code fences before `JSON.parse`.

---

## 5. Data Model

```
User {
  id            string (PK)      // e.g. "PM01", "DEV01", "ADMIN"
  name          string, required
  email         string, required, unique
  passwordHash  string, required
  role          enum: ADMIN | MANAGER | AGENT
  specialization string
  skills        string[]
}

Project {
  id          string (PK, generated)
  name        string, required
  clientName  string, required
  description string
  managerId   FK -> User.id (role must be MANAGER)
  deadline    date (YYYY-MM-DD)
}

Task {
  id             string (PK, generated)
  projectId      FK -> Project.id
  title          string, required
  description    string
  assigneeId     FK -> User.id (role must be AGENT)
  deadline       date (YYYY-MM-DD)
  estimatedHours number, > 0
}
```

**Relationships:** one manager → many projects; one project → many tasks; one agent → many tasks across projects.
**Excluded fields:** cost, hourly rate, progress/status percentage.

---

## 6. API Surface (suggested)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Create session |
| POST | `/api/auth/logout` | Auth | End session |
| GET | `/api/me` | Auth | Current user from session |
| GET | `/api/team` | Auth | Read-only directory (name, role, specialization) |
| GET | `/api/projects` | Auth (scoped) | `getProjects(currentUser)` |
| GET | `/api/projects/:id` | Auth (scoped) | `getProjectById(currentUser, id)` |
| GET | `/api/my-tasks` | AGENT | Agent's assigned tasks + project name/manager |
| POST | `/api/transcript/create` | ADMIN only | Run AI conversion + validate + save |

All endpoints derive identity from the session and apply role scoping in the query layer.

---

## 7. Non-Functional Requirements

- **Security:** hashed passwords; session/cookie auth; server-side authorization on every route; API keys and DB credentials only in environment variables.
- **Persistence:** local or hosted database (PostgreSQL recommended; Aiven free tier for hosted bonus).
- **Atomicity:** transactional save for all projects + tasks.
- **Performance:** AI conversion should complete within ~30–60 s; show a loading indicator throughout.
- **Usability:** clear loading, success, and error states; readable cards and tables; basic responsiveness.
- **Idempotent setup:** seed script safe to re-run.
- **Config:** `.env.example` with placeholders (e.g., `DATABASE_URL`, `SESSION_SECRET`, `LLM_API_KEY`, `LLM_MODEL`).

---

## 8. Recommended Tech Stack (flexible — any stack allowed)

| Layer | Suggestion |
|---|---|
| Frontend + Backend | Next.js (App Router) or React + Express |
| Database | PostgreSQL (local Docker or Aiven free tier) |
| ORM | Prisma or Drizzle |
| Auth | NextAuth/credentials or `express-session` + bcrypt |
| AI | Anthropic or OpenAI API with JSON/structured output |
| Validation | Zod (validate AI draft against schema) |
| Deploy (bonus) | Vercel / Render + Aiven PostgreSQL |

---

## 9. Acceptance Criteria and Verification

### 9.1 Expected result from the supplied transcript: **3 projects, 12 tasks**

| Project | Manager | Deadline | Tasks | Hours |
|---|---|---|---|---|
| UrbanCart Website | Ayesha (PM01) | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal (PM02) | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina (PM03) | 2026-10-22 | 4 | 38 |

| Project / Task | Owner | Deadline | Hours | Note |
|---|---|---|---|---|
| UrbanCart / Product catalog UI | Ali (DEV01) | 2026-10-12 | 12 | Final |
| UrbanCart / Demo cart UI | Ali (DEV01) | 2026-10-15 | 8 | Final |
| UrbanCart / Product and cart APIs | Hamza (DEV02) | 2026-10-14 | 14 | Final |
| UrbanCart / Website integration and testing | Ali (DEV01) | 2026-10-19 | 6 | Revised date |
| QuickServe / Login and profile screens | Sara (DEV03) | 2026-10-12 | 8 | Final |
| QuickServe / Service booking screens | Sara (DEV03) | 2026-10-17 | 12 | Final |
| QuickServe / Booking and account APIs | Hamza (DEV02) | 2026-10-16 | 16 | Final |
| QuickServe / Mobile integration and testing | Usman (DEV04) | 2026-10-22 | 10 | Revised hours |
| HelpDeskPro / FAQ document processing | Maryam (DEV06) | 2026-10-13 | 10 | Final |
| HelpDeskPro / Assistant answer generation | Zain (DEV05) | 2026-10-17 | 14 | Final |
| HelpDeskPro / Human escalation flow | Zain (DEV05) | 2026-10-18 | 6 | Final |
| HelpDeskPro / Assistant evaluation and testing | Maryam (DEV06) | 2026-10-21 | 8 | Revised owner |

### 9.2 "Trap" checks (must pass)
- UrbanCart deadline is **20 Oct**, not 18 Oct.
- UrbanCart integration task is due **19 Oct**, not 17 Oct.
- QuickServe integration is **10 hours**, not 8.
- HelpDeskPro testing owner is **Maryam**, not Zain.
- **Kamran** is not added as a user or assignee.
- **No** payment, inventory, maps, driver-tracking, or real-email tasks.
- Hamza's two API tasks (14 h and 16 h) are **not merged**.
- Ali's frontend work is **two tasks** (12 h + 8 h), not one 20 h task.

### 9.3 Changed-input test
Modify the transcript so QuickServe's integration final estimate is **12 hours** and deadline **23 October**. The generated task must reflect 12 h / 2026-10-23, and all other tasks remain unchanged.

### 9.4 Feature acceptance checklist

- [ ] Seed script creates 10 users; re-run creates no duplicates
- [ ] Login/logout works for all 10 accounts; bad password shows error
- [ ] Admin home shows all project cards and Create from Transcript
- [ ] Non-admins cannot access transcript creation (UI hidden **and** API returns 403)
- [ ] Empty transcript is rejected with a clear message
- [ ] Loading state shown; button disabled during processing
- [ ] Valid transcript → 3 projects, 12 tasks saved
- [ ] Invalid AI output / unknown assignee / bad date → nothing saved, unresolved fields shown, correction possible
- [ ] Project detail shows client, manager, deadline, tasks (title, description, assignee, deadline, hours)
- [ ] Ayesha sees only UrbanCart
- [ ] Ali sees only his 3 tasks + the related project
- [ ] Hamza sees his 2 tasks across UrbanCart and QuickServe
- [ ] Direct URL/API access to another user's project/task is denied
- [ ] Data persists after refresh/restart
- [ ] Team directory is read-only, shows names + specializations
- [ ] Modified-transcript test produces matching changes

---

## 10. Demo Script (video / live judging)

1. Run the seed script; show no signup is needed.
2. Log in as **admin**; paste the supplied transcript.
3. Click **Create from Transcript**; show loading → success: 3 projects, 12 tasks.
4. Open a project; show client, manager, deadline, tasks with hours.
5. Log in as **Ayesha** → only UrbanCart. Log in as **Ali** → only his 3 tasks + related project. Attempt direct access to another project → denied.
6. Log in as **Hamza** → 2 tasks across UrbanCart and QuickServe.
7. Refresh → data still there.
8. Paste a **modified transcript** → show the AI output changes accordingly.

---

## 11. Suggested 3-Hour Plan (team of 4)

| Time | Member A (Backend/DB) | Member B (Auth/Access) | Member C (AI) | Member D (Frontend) |
|---|---|---|---|---|
| 0:00–0:30 | Schema, DB setup, seed script | Session auth, login/logout API | Prompt draft, JSON schema, test with transcript | Project scaffold, login page, layout |
| 0:30–1:30 | Project/task queries, transactional save | Role-scoped queries + route guards | AI call, parsing, Zod validation, error handling | Admin home, project list/detail, task rows |
| 1:30–2:15 | Integrate create endpoint | Access tests (admin/manager/agent) | Tune for corrections/rejected features; changed-input test | Transcript screen, loading/error/success, My Tasks, directory |
| 2:15–2:45 | Hosted DB / deploy (bonus) | Direct-URL access checks | Edge cases, retry on bad JSON | UI polish, empty states |
| 2:45–3:00 | README, `.env.example`, demo video | Final QA | Final QA | Final QA |

---

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| LLM picks superseded values (e.g., old deadline) | Prompt: "later corrections override earlier"; reference the final recap; test with answer key |
| LLM invents employees (e.g., Kamran) | Provide directory; instruct to use only listed IDs; server-side ID/role validation |
| Malformed JSON | Structured output mode, strip fences, validate with schema, return error without saving |
| Partial saves | Single DB transaction |
| Double-click duplicates | Disable button + server-side in-flight guard |
| Access leaks via direct URLs | Authorization inside data layer, tested via direct requests |
| Hard-coded fake output | Judges test a modified transcript; always call the AI live |
| Secret leakage | `.env` gitignored; commit only `.env.example` |

---

## 13. Deliverables

- Working app (local acceptable; **hosted + live link = extra marks**)
- Public GitHub repo with root `README.md`
- Demo video (required if local DB)
- `.env.example` with placeholders (no real keys/passwords)

### README must include
Project/team name; stack; working features; exact setup/run commands; DB setup and seed command; environment-variable names; demo emails/passwords; transcript testing steps; live/demo-video links; deployment platform, DB provider and deployment steps; known limitations.

---

## 14. Open Questions / Assumptions

- Assumed AI provider and API key are supplied by each team via environment variable.
- Assumed "correction" flow means editing the unresolved fields (or the transcript) and revalidating; full project/task editing is optional.
- Assumed all dates are in 2026 and times in Asia/Karachi.
- Assumed team directory is visible to all logged-in users (read-only).
- Optional stretch: inline editing of created projects/tasks; total-hours display per project.
