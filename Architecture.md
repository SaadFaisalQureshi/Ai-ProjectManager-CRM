# Architecture: AI Project Manager — Meeting to Execution

**Companion to:** `PRD.md`
**Scope:** MVP for The Infinity Hack '26 (3-hour build, team of 4)
**Status:** v1.0

> The stack below is a recommendation. Any stack works as long as the layering, authorization rules, and transactional save described here are preserved.

---

## 1. Architectural Goals

| Goal | How the architecture delivers it |
|---|---|
| Working meeting-to-project flow | A single server-side service (`createFromTranscript`) orchestrates AI → validate → save |
| Server-enforced access control | Authorization lives in the **data-access layer**, not in the UI or route handlers alone |
| No partial data | One database transaction for all projects + tasks |
| Trustworthy AI output | LLM output is treated as **untrusted input**: parsed, schema-validated, and cross-checked against the DB before saving |
| Fast to build | Monolith, one repo, one deployable, minimal moving parts |
| Easy to demo and judge | Idempotent seed script, `.env.example`, deterministic validation errors |

---

## 2. System Context

```mermaid
flowchart LR
    Admin([Admin]) --> App
    Manager([Manager]) --> App
    Agent([Agent]) --> App

    subgraph App[AI Project Manager CRM]
        UI[Web UI]
        API[Server API]
    end

    API <--> DB[(PostgreSQL)]
    API -->|transcript + directory| LLM[[LLM Provider API]]
    LLM -->|JSON draft| API
```

**External dependencies:** a PostgreSQL database (local or Aiven) and one LLM provider API. There are no email services, payment systems, or third-party identity providers.

---

## 3. Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | UI and API in one project, one deploy |
| UI | React + Tailwind | Fast, clean cards/tables |
| ORM | Prisma (or Drizzle) | Typed queries, transactions, migrations |
| Database | PostgreSQL | Required for hosted bonus (Aiven free tier); local via Docker |
| Auth | Credentials login + signed HTTP-only session cookie (e.g., `iron-session` / NextAuth credentials) | Standard session mechanism, identity from session |
| Password hashing | bcrypt / argon2 | Hash `Demo123!` at seed time |
| Validation | Zod | One schema for the AI output shape and business rules |
| AI | Anthropic or OpenAI SDK, JSON/structured output, low temperature | Deterministic extraction |
| Deploy (bonus) | Vercel or Render + Aiven PostgreSQL | Fully hosted demo |

---

## 4. High-Level Component View

```mermaid
flowchart TB
    subgraph Client[Browser]
        L[Login page]
        AH[Admin Home + Transcript form]
        PL[Projects list / detail]
        MT[My Tasks]
        TD[Team directory]
    end

    subgraph Server[Next.js Server]
        direction TB
        R[Route handlers / API]
        SM[Session middleware]
        subgraph Services
            AS[AuthService]
            PS[ProjectService]
            TS[TranscriptService]
        end
        subgraph Data[Data-access layer — authorization lives here]
            UR[UserRepo]
            PR[ProjectRepo scoped by currentUser]
            TR[TaskRepo scoped by currentUser]
        end
        AIC[AI Client]
        VAL[Draft Validator - Zod + DB checks]
    end

    DB[(PostgreSQL)]
    LLM[[LLM API]]

    Client --> R
    R --> SM --> Services
    AS --> UR
    PS --> PR
    PS --> TR
    TS --> AIC --> LLM
    TS --> VAL
    VAL --> UR
    TS -->|transaction| PR
    TS -->|transaction| TR
    UR --> DB
    PR --> DB
    TR --> DB
```

### Layer responsibilities

| Layer | Responsibility | Must **not** |
|---|---|---|
| UI | Render screens, call API, show loading/error states | Decide permissions |
| Route handlers | Parse request, resolve session user, call a service, shape response | Contain business rules or raw queries |
| Services | Orchestrate use cases (`login`, `getProjects`, `createFromTranscript`) | Trust caller-supplied role/user IDs |
| Data-access (repos) | Role-scoped queries; the only code that touches the DB | Expose unscoped queries to routes |
| AI client | Build prompt, call LLM, return raw text/JSON | Write to the DB |
| Validator | Schema + business-rule checks on the AI draft | Mutate or "fix" data silently |

---

## 5. Project Structure (suggested)

```
/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # seedUsers() — upsert by email
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── (app)/
│   │   │   ├── page.tsx                 # role-based home
│   │   │   ├── projects/[id]/page.tsx
│   │   │   ├── my-tasks/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   └── transcript/page.tsx      # admin only
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── me/route.ts
│   │       ├── team/route.ts
│   │       ├── projects/route.ts
│   │       ├── projects/[id]/route.ts
│   │       ├── my-tasks/route.ts
│   │       └── transcript/create/route.ts
│   ├── lib/
│   │   ├── session.ts           # getCurrentUser(req)
│   │   ├── db.ts                # Prisma client
│   │   ├── access/              # getProjects / getTasks / getProjectById
│   │   ├── ai/
│   │   │   ├── prompt.ts
│   │   │   ├── client.ts
│   │   │   └── schema.ts        # Zod schema = AI output shape
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── project.service.ts
│   │       └── transcript.service.ts
│   └── components/              # ProjectCard, TaskRow, TranscriptForm, ...
├── .env.example
├── README.md
├── PRD.md
└── Architecture.md
```

---

## 6. Data Architecture

### 6.1 Entity-relationship diagram

```mermaid
erDiagram
    USER ||--o{ PROJECT : "manages (MANAGER)"
    USER ||--o{ TASK : "assigned to (AGENT)"
    PROJECT ||--|{ TASK : contains

    USER {
        string id PK "PM01, DEV01, ADMIN"
        string name
        string email UK
        string passwordHash
        enum role "ADMIN|MANAGER|AGENT"
        string specialization
        string[] skills
    }
    PROJECT {
        string id PK "generated"
        string name
        string clientName
        string description
        string managerId FK
        date deadline
    }
    TASK {
        string id PK "generated"
        string projectId FK
        string title
        string description
        string assigneeId FK
        date deadline
        float estimatedHours
    }
```

### 6.2 Prisma schema (reference)

```prisma
enum Role { ADMIN MANAGER AGENT }

model User {
  id             String    @id            // seeded: "PM01", "DEV01", ...
  name           String
  email          String    @unique
  passwordHash   String
  role           Role
  specialization String?
  skills         String[]
  managedProjects Project[] @relation("ProjectManager")
  tasks          Task[]    @relation("TaskAssignee")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  clientName  String
  description String?
  managerId   String
  manager     User     @relation("ProjectManager", fields: [managerId], references: [id])
  deadline    DateTime @db.Date
  tasks       Task[]

  @@index([managerId])
}

model Task {
  id             String   @id @default(cuid())
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  assigneeId     String
  assignee       User     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  deadline       DateTime @db.Date
  estimatedHours Float

  @@index([projectId])
  @@index([assigneeId])
}
```

**Notes**
- User IDs are the fixed seed IDs so the AI directory and stored assignments reference the same values.
- Project/task IDs are generated by the application, never by the model.
- Role constraints (manager must be MANAGER, assignee must be AGENT) are enforced in the validator because they cannot be expressed as simple FK constraints. Optionally add a DB check/trigger.
- `estimatedHours > 0` enforced in the validator and optionally via a DB `CHECK` constraint.
- No cost, rate, or progress columns.

---

## 7. Authentication and Session

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as /api/auth/login
    participant DB as PostgreSQL

    B->>A: POST email, password
    A->>DB: find user by email
    alt missing or bcrypt mismatch
        A-->>B: 401 invalid credentials
    else ok
        A->>A: create signed session {userId}
        A-->>B: Set-Cookie (HttpOnly, SameSite=Lax, Secure in prod)
        B->>B: redirect by role
    end
```

- Session stores **only `userId`**. The role is re-read from the DB on each request via `getCurrentUser()`; it is never taken from the request body, query string, or headers.
- Cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production; secret from `SESSION_SECRET`.
- Login error is generic ("invalid credentials") for both unknown email and wrong password.
- Logout destroys the session cookie.
- Seed hashes `Demo123!` before storing; plaintext never persisted.

---

## 8. Authorization Architecture

Authorization is implemented **once**, in the data-access layer, and every read path goes through it. Route handlers cannot reach unscoped queries.

```mermaid
flowchart LR
    Req[Request] --> S[getCurrentUser from session]
    S -->|none| E401[401]
    S --> Svc[Service]
    Svc --> Scope{currentUser.role}
    Scope -->|ADMIN| QA[all rows]
    Scope -->|MANAGER| QM[where managerId = me]
    Scope -->|AGENT| QG[where assigneeId = me]
    QA --> Out[Result]
    QM --> Out
    QG --> Out
```

### Access matrix

| Operation | ADMIN | MANAGER | AGENT |
|---|---|---|---|
| `getProjects` | All | `managerId == me` | Distinct projects containing my tasks |
| `getProjectById` | Any | Only if I manage it | Only if it contains a task assigned to me |
| `getTasks(projectId)` | All tasks | All tasks, only if I manage the project | Only tasks where `assigneeId == me` |
| `createFromTranscript` | Yes | 403 | 403 |
| `getTeam` (directory) | Yes | Yes | Yes (name, role, specialization only) |

### Reference implementation (pseudocode)

```ts
export async function getProjects(user: User) {
  switch (user.role) {
    case "ADMIN":
      return db.project.findMany({ include: { manager: true, _count: { select: { tasks: true } } } });
    case "MANAGER":
      return db.project.findMany({ where: { managerId: user.id }, include: { manager: true } });
    case "AGENT":
      return db.project.findMany({
        where: { tasks: { some: { assigneeId: user.id } } },
        include: { manager: true },
      });
  }
}

export async function getProjectById(user: User, projectId: string) {
  const visible = await getProjects(user);
  const project = visible.find(p => p.id === projectId);
  if (!project) throw new NotFoundOrForbidden();        // same response either way: no existence leak
  const tasks = await getTasks(user, projectId);
  return { ...project, tasks };
}

export async function getTasks(user: User, projectId: string) {
  const where =
    user.role === "ADMIN"   ? { projectId } :
    user.role === "MANAGER" ? { projectId, project: { managerId: user.id } } :
                              { projectId, assigneeId: user.id };
  return db.task.findMany({ where, include: { assignee: { select: { id: true, name: true } } } });
}
```

**Rules**
- Return **404** (or a uniform 403) for out-of-scope resources so existence is not leaked.
- API responses use explicit field selection: never return `passwordHash` or `email` unless needed.
- The team directory endpoint returns only `id, name, role, specialization`.
- Frontend hides buttons for UX, but the server is the source of truth.

---

## 9. Transcript-to-Records Pipeline

### 9.1 Sequence

```mermaid
sequenceDiagram
    participant UI as Admin UI
    participant API as POST /api/transcript/create
    participant TS as TranscriptService
    participant DB as PostgreSQL
    participant AI as AI Client / LLM
    participant V as Validator

    UI->>UI: disable button, show loading
    UI->>API: { transcript }
    API->>API: getCurrentUser, require ADMIN
    API->>TS: createFromTranscript(user, transcript)
    TS->>TS: reject empty transcript
    TS->>DB: load directory (id, name, role, skills)
    TS->>AI: transcript + directory + output shape
    AI-->>TS: raw JSON text
    TS->>V: parse + Zod schema + business rules
    V->>DB: verify managerId/assigneeId exist and roles match
    alt validation issues
        V-->>TS: list of unresolved fields
        TS-->>API: 422 { issues }
        API-->>UI: show issues, allow correction + revalidate
    else valid
        TS->>DB: BEGIN transaction
        TS->>DB: insert projects + tasks (generated IDs)
        TS->>DB: COMMIT
        TS-->>API: created projects + task counts
        API-->>UI: success summary
    end
    note over TS,DB: any failure → ROLLBACK, nothing persisted
```

### 9.2 Pipeline stages

| Stage | Input | Output | Failure behavior |
|---|---|---|---|
| 1. Authorize | Session user | Admin confirmed | 401/403 |
| 2. Pre-check | Raw transcript | Trimmed non-empty text | 400 "Transcript is empty" |
| 3. Build directory | DB users | `[{id, name, role, skills}]` | 500 |
| 4. AI call | Transcript + directory + schema | Raw JSON string | Timeout/API error → 502, nothing saved |
| 5. Parse | Raw string | JS object | Strip code fences; parse error → 422/502 |
| 6. Validate | Object | Typed draft or issue list | Return issues, save nothing |
| 7. Persist | Valid draft | Saved rows | Rollback on any error |
| 8. Respond | Saved rows | Summary with counts | n/a |

### 9.3 Directory sent to the AI

```json
[
  { "id": "PM01",  "name": "Ayesha Khan", "role": "MANAGER", "skills": ["Web projects", "client coordination"] },
  { "id": "DEV01", "name": "Ali Raza",    "role": "AGENT",   "skills": ["React", "frontend integration"] }
]
```

Never included: `passwordHash`, passwords, emails, session data.

### 9.4 Prompt design

**System prompt (outline)**
1. You convert a meeting transcript into project-management records.
2. Return **only** JSON matching the provided shape. No prose, no markdown fences.
3. Use **only** `managerId` / `assigneeId` values from the provided directory. Managers must have role MANAGER; assignees must have role AGENT.
4. Follow **final agreed decisions**. If a value is corrected later (deadline, hours, owner), use the latest value. The final recap is authoritative.
5. Do **not** create tasks for rejected or excluded features (e.g., payments, inventory, maps, driver tracking, real email sending, separate native iOS/Android work).
6. Do **not** add people who are not in the directory (e.g., external contacts) and never assign work to them.
7. Keep tasks distinct even if the same person owns them. Do not merge or split tasks beyond what was agreed.
8. `estimatedHours` is developer effort in hours, not calendar days. Do not add management hours.
9. Dates are `YYYY-MM-DD` in 2026. Task deadline must be on or before its project deadline.
10. If a required value cannot be determined, set it to `null` instead of guessing.

**User message:** directory JSON + full transcript + the output shape example.

**Call settings:** temperature 0–0.2, enough max tokens for ~12 tasks plus descriptions, provider JSON mode or tool/structured output where available, request timeout (e.g., 60 s).

### 9.5 Validation rules

```ts
const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  assigneeId: z.string().min(1),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estimatedHours: z.number().positive(),
});

const ProjectSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  description: z.string().optional().default(""),
  managerId: z.string().min(1),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tasks: z.array(TaskSchema),
});

const DraftSchema = z.object({ projects: z.array(ProjectSchema).min(1) });
```

**Business-rule checks (after schema pass)**

| Check | Issue message example |
|---|---|
| Date is a real calendar date | `projects[1].deadline: "2026-02-30" is not a valid date` |
| `managerId` exists and role is MANAGER | `projects[0].managerId: "PM09" is not a known manager` |
| `assigneeId` exists and role is AGENT | `projects[2].tasks[1].assigneeId: "Kamran" is not a known developer` |
| `estimatedHours > 0` | `projects[1].tasks[0].estimatedHours must be positive` |
| Task deadline <= project deadline | `projects[0].tasks[3].deadline is after project deadline` |
| `null` required value from AI | `projects[0].tasks[2].assigneeId: could not be resolved` |

All issues are collected and returned together (not fail-on-first) so the admin can correct everything in one pass.

### 9.6 Correction and revalidation flow

When validation fails:
1. Server returns `422` with `{ issues: [{ path, message }], draft }`; **nothing is saved**.
2. The UI shows each unresolved field next to an editable control (dropdown of valid managers/agents, date picker, number input).
3. The admin fixes the values and clicks **Revalidate and Save**, which posts the corrected draft to the same endpoint (`mode: "draft"`) and skips the AI call.
4. The same validator runs; on success the transaction saves everything.

(Simpler fallback: show issues and let the admin edit the transcript and resubmit.)

### 9.7 Transactional save

```ts
await db.$transaction(async (tx) => {
  for (const p of draft.projects) {
    const project = await tx.project.create({
      data: {
        name: p.name, clientName: p.clientName, description: p.description,
        managerId: p.managerId, deadline: new Date(p.deadline),
        tasks: {
          create: p.tasks.map(t => ({
            title: t.title, description: t.description,
            assigneeId: t.assigneeId, deadline: new Date(t.deadline),
            estimatedHours: t.estimatedHours,
          })),
        },
      },
    });
  }
});
```

Any thrown error aborts the whole transaction, so there are no partial projects.

### 9.8 Duplicate-submission protection

| Layer | Mechanism |
|---|---|
| UI | Disable the submit button and show a spinner while the request is in flight |
| Server | Per-user in-flight lock (in-memory map or advisory lock) so a second concurrent request returns `409` |
| Optional | Idempotency key supplied by the client with the request |

---

## 10. API Contract

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | Public | `{email, password}` | `200 {user:{id,name,role}}` + cookie | `401` invalid credentials |
| POST | `/api/auth/logout` | Auth | none | `204` | n/a |
| GET | `/api/me` | Auth | none | `200 {id,name,role}` | `401` |
| GET | `/api/team` | Auth | none | `200 [{id,name,role,specialization}]` | `401` |
| GET | `/api/projects` | Auth | none | `200 [project cards]` (scoped) | `401` |
| GET | `/api/projects/:id` | Auth | none | `200 {project, tasks}` (scoped) | `401`, `404` |
| GET | `/api/my-tasks` | AGENT | none | `200 [tasks + project name + manager]` | `401`, `403` |
| POST | `/api/transcript/create` | ADMIN | `{transcript}` or `{draft}` | `201 {projects:[{id,name,taskCount}]}` | `400` empty, `401`, `403`, `409` in-flight, `422 {issues, draft}`, `502` AI failure |

**Response example, successful creation**
```json
{
  "created": {
    "projectCount": 3,
    "taskCount": 12,
    "projects": [
      { "id": "c1...", "name": "UrbanCart Website", "taskCount": 4 },
      { "id": "c2...", "name": "QuickServe Mobile App", "taskCount": 4 },
      { "id": "c3...", "name": "HelpDeskPro AI Assistant", "taskCount": 4 }
    ]
  }
}
```

---

## 11. Frontend Architecture

### 11.1 Route map and guards

| Route | Visible to | Guard |
|---|---|---|
| `/login` | Public | Redirect to home if already logged in |
| `/` | All | Renders role-specific home (Admin: all projects + CTA; Manager: my projects; Agent: My Tasks) |
| `/projects/[id]` | All (scoped) | Server fetch; 404 page if API denies |
| `/my-tasks` | AGENT | Redirect others |
| `/team` | All | none |
| `/transcript` | ADMIN | Redirect others (server also enforces) |

### 11.2 Key components

| Component | Purpose |
|---|---|
| `ProjectCard` | Name, client, manager, deadline, task count |
| `TaskRow` | Title, description, assignee, deadline, hours |
| `TranscriptForm` | Textarea, submit, loading/disabled state |
| `ValidationIssues` | Lists unresolved fields with inline correction controls |
| `ResultSummary` | Created projects with task counts, links to detail |
| `TeamTable` | Read-only directory |
| `RoleNav` | Navigation links per role |

### 11.3 TranscriptForm state machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Submitting: click Create (non-empty)
    Idle --> Idle: empty -> inline error
    Submitting --> Success: 201
    Submitting --> NeedsCorrection: 422 issues
    Submitting --> Error: 502 / network
    NeedsCorrection --> Submitting: Revalidate and Save
    Error --> Idle: dismiss / retry
    Success --> [*]: view projects
```

---

## 12. Configuration and Environment

`.env.example`
```
DATABASE_URL="postgresql://user:password@localhost:5432/novaworks"
SESSION_SECRET="change-me-to-a-long-random-string"
LLM_PROVIDER="anthropic"            # or openai
LLM_API_KEY="your-api-key"
LLM_MODEL="your-model-name"
LLM_TIMEOUT_MS="60000"
```

- Real secrets are never committed; `.env` is in `.gitignore`.
- The LLM key is read only on the server and never exposed to the browser (no `NEXT_PUBLIC_` prefix).

**Commands (reference)**
```bash
npm install
npx prisma migrate deploy      # or: npx prisma db push
npm run seed                    # seedUsers(): upsert by email, hash Demo123!
npm run dev
```

---

## 13. Deployment Architecture

### 13.1 Local

```mermaid
flowchart LR
    Dev[Developer machine] --> Next[Next.js :3000]
    Next --> PG[(Postgres in Docker :5432)]
    Next --> LLM[[LLM API]]
```

### 13.2 Hosted (bonus marks)

```mermaid
flowchart LR
    U([Judge browser]) --> V[Vercel / Render<br/>Next.js app]
    V --> A[(Aiven PostgreSQL<br/>free tier)]
    V --> L[[LLM API]]
```

| Step | Action |
|---|---|
| 1 | Create Aiven free PostgreSQL; copy the connection string (SSL required) |
| 2 | Set `DATABASE_URL`, `SESSION_SECRET`, `LLM_*` as host environment variables |
| 3 | Run `prisma migrate deploy` and `npm run seed` against the hosted DB |
| 4 | Deploy the app (Vercel/Render); confirm login works |
| 5 | Put the live URL and demo credentials in the README |

**Deployment caveats**
- On serverless hosts, the LLM call may hit function time limits; raise the max duration for the transcript route or use a host with longer timeouts.
- In-memory in-flight locks do not span serverless instances; use a DB advisory lock or idempotency key if deploying serverless.
- Aiven requires SSL (`sslmode=require`).

---

## 14. Cross-Cutting Concerns

### 14.1 Security

| Threat | Control |
|---|---|
| Role spoofing | Role read from DB via session user ID; ignore client-sent roles |
| IDOR (viewing others' projects/tasks) | Scoped queries in the data layer; 404 on out-of-scope IDs |
| Credential leakage | Hashed passwords; never returned or sent to the AI |
| Prompt injection via transcript | AI output is untrusted: schema + DB validation; AI has no tools or DB access; users and roles verified server-side |
| Secrets in repo | `.env` gitignored; `.env.example` placeholders only |
| Session theft | HttpOnly, SameSite, Secure cookies |
| Brute force on login | Optional: simple rate limit per IP/email |

### 14.2 Error handling

| Failure | User-visible outcome | Persisted data |
|---|---|---|
| Empty transcript | Inline message | None |
| LLM timeout / API error | "AI service unavailable, try again" | None |
| Non-JSON / malformed output | "Could not understand AI output, try again" | None |
| Validation issues | List of unresolved fields with correction UI | None |
| DB error mid-save | Generic error | Rolled back, none |

### 14.3 Observability (lightweight)
- Log: request ID, user ID, stage reached, validation issue count, AI latency.
- Never log passwords, hashes, or the API key. Log transcript length, not full content (optional).

### 14.4 Performance
- Single LLM call per conversion (~10–40 s typical); show spinner and elapsed state.
- Project/task queries are small; indexes on `Project.managerId`, `Task.projectId`, `Task.assigneeId`.

---

## 15. Testing Strategy

| Level | What to test |
|---|---|
| Unit | Zod schemas; date validation; task-deadline <= project-deadline; role checks |
| Integration | `getProjects/getTasks/getProjectById` per role; transactional rollback when one task is invalid |
| API / access | Direct requests as Ali to Ayesha's project → 404/403; non-admin POST transcript → 403 |
| AI regression | Supplied transcript → exactly 3 projects / 12 tasks matching the answer key; trap checks (Kamran, rejected features, revised values) |
| Changed-input | QuickServe integration → 12 h / 2026-10-23; other tasks unchanged |
| Manual E2E | Follow the demo script in `PRD.md` §10 |

**Answer-key assertion sketch**
```ts
expect(projects).toHaveLength(3);
expect(tasks).toHaveLength(12);
expect(byTitle("Website integration and testing")).toMatchObject({ assigneeId: "DEV01", estimatedHours: 6, deadline: "2026-10-19" });
expect(byTitle("Mobile integration and testing")).toMatchObject({ assigneeId: "DEV04", estimatedHours: 10 });
expect(byTitle("Assistant evaluation and testing").assigneeId).toBe("DEV06");
expect(allAssignees).not.toContain("Kamran");
```

---

## 16. Key Design Decisions

| # | Decision | Rationale | Trade-off |
|---|---|---|---|
| 1 | Monolith (Next.js full-stack) | Fastest for 3 hours; one deploy | Less separation than a split frontend/backend |
| 2 | Authorization in the data-access layer | Single enforcement point; protects direct API calls | Slightly more boilerplate than ad-hoc checks |
| 3 | AI output treated as untrusted | Prevents hallucinated users/dates from corrupting data | Extra validation code |
| 4 | App-generated IDs; model returns only content + user refs | Consistent relationships, no model-controlled keys | Requires mapping step on save |
| 5 | All-or-nothing transaction | Meets "no partial projects" requirement | One bad field blocks the whole batch (mitigated by correction UI) |
| 6 | Seed IDs reused as user primary keys (`PM01`, `DEV01`) | Same IDs in AI directory and saved assignments | Not auto-generated; fine for fixed demo users |
| 7 | Session stores `userId` only | Role changes and checks always reflect DB truth | One extra DB read per request |
| 8 | Two-mode endpoint (`transcript` or corrected `draft`) | Enables correction flow without another AI call | Slightly larger API surface |

---

## 17. Known Limitations (MVP)

- No signup, password reset, email verification, or user management (by design).
- No editing of created projects/tasks (optional stretch).
- No cost, budget, or progress tracking (out of scope).
- LLM extraction is probabilistic; validation catches structural errors but cannot detect a plausible-but-wrong value, so review the result against the transcript.
- In-memory duplicate-request lock is per instance only.
- Rate limiting and audit logging are minimal.
