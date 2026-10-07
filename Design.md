# Design: AI Project Manager — Meeting to Execution

**Companion to:** `PRD.md`, `Architecture.md`
**Scope:** UI/UX specification for the MVP (all screens required by the challenge)
**Status:** v1.0

---

## 1. Design Brief

| | |
|---|---|
| **Product** | Internal project CRM for NovaWorks Technologies (Lahore). The admin turns a meeting transcript into projects and tasks. |
| **Audience** | Three kinds of staff: the admin (runs the transcript flow), project managers (check their projects), and developers (check what is assigned to them). Hackathon judges are a fourth, short-attention audience. |
| **Primary job** | Make the jump from "what people said" to "what people now own" obvious and trustworthy. |
| **Judged on** | A working flow and a clear frontend, within three hours. The design must be cheap to build. |

### 1.1 Concept: said → decided

The product's one idea is the difference between **what was said** and **what was decided**. The design encodes that difference in the type:

- **Serif text = source material** (the pasted transcript).
- **Sans-serif text = records** (projects, tasks, owners, dates, hours).

When the admin moves from the transcript screen to the project screens, the typography changes with the status of the content. No explanatory copy is needed.

### 1.2 Where the boldness goes

One memorable element: the **transcript workspace**, a calm two-pane screen with the serif transcript on the left and the structured result on the right. Everything else is quiet and disciplined: flat surfaces, hairline borders, one accent color.

### 1.3 What we are deliberately avoiding

- Cream background with serif display and clay/terracotta accent.
- Near-black background with a single neon accent.
- Identical rounded cards with the same soft shadow on everything.
- All-caps tracked labels above every heading, middle-dot meta strings, arrows on every button.
- Gradient washes, charts, progress bars, percentages (also out of scope per the PRD).

---

## 2. Design Principles

1. **Show ownership first.** Every task row answers: who, by when, how many hours.
2. **Scope is the interface.** Admin, manager, and agent each get a screen that contains only their work. No disabled buttons or greyed-out sections for things they can't access. Those things simply aren't there.
3. **Never lose the admin's input.** If the AI output fails validation, the transcript stays in place and the issues appear beside it.
4. **Say exactly what happened.** Loading, success, and errors name the specific thing: counts, field names, the reason.
5. **Borders over shadows.** Structure comes from hairlines and spacing, so the layout is cheap to build and consistent.
6. **Build to a floor.** Keyboard focus visible, text contrast at least 4.5:1, responsive to 360 px, reduced motion respected.

---

## 3. Design Tokens

### 3.1 Color

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F3F5F6` | App background (cool grey-white) |
| `surface` | `#FFFFFF` | Cards, tables, inputs |
| `ink` | `#17212B` | Primary text |
| `slate` | `#5B6975` | Secondary text, metadata |
| `line` | `#D9DFE4` | Borders and dividers |
| `lagoon` | `#0E6B73` | Primary action, links, focus ring |
| `lagoon-dark` | `#0A545B` | Primary hover/pressed |
| `lagoon-tint` | `#E3F1F2` | Selected nav item, success-adjacent surfaces, current row |
| `marigold` | `#D98E04` | Deadline markers (never used as text on white) |
| `marigold-tint` | `#FCF3DC` | Validation issue highlight background |
| `brick` | `#B3261E` | Errors |
| `brick-tint` | `#FBE9E7` | Error banner background |
| `fern` | `#2E7D4F` | Success text and icon |

**Project hues.** Each project gets one of these as a 4 px left edge on its card and a dot beside its name in task lists. Assign by creation order, cycling.

| # | Hex |
|---|---|
| 1 | `#3B5BDB` |
| 2 | `#C2255C` |
| 3 | `#2F9E44` |
| 4 | `#E8590C` |
| 5 | `#7048E8` |
| 6 | `#0C8599` |

Project color is **never the only carrier of meaning**. The project name always appears next to the dot.

**Contrast checks (approximate):** `ink` on `paper` ≈ 15:1; `slate` on `surface` ≈ 5.6:1; `lagoon` on `surface` ≈ 6:1; white on `lagoon` ≈ 6:1; white on `brick` ≈ 6.9:1.

### 3.2 Typography

| Role | Family | Fallback | Used for |
|---|---|---|---|
| Interface and records | **Schibsted Grotesk** | `system-ui, -apple-system, "Segoe UI", sans-serif` | Everything except the transcript |
| Source text | **Newsreader** | `Georgia, "Times New Roman", serif` | Transcript textarea and any quoted transcript text |

Both load from Google Fonts. Numbers in tables use `font-variant-numeric: tabular-nums`.

**Scale** (sans unless noted)

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `text-xs` | 12 / 16 | 500 | Table column headings, helper text |
| `text-sm` | 14 / 20 | 400 | Table cells, secondary text, buttons |
| `text-base` | 16 / 24 | 400 | Body, form inputs |
| `text-lg` | 20 / 28 | 600 | Card titles, section headings |
| `text-xl` | 24 / 32 | 600 | Page titles |
| `text-2xl` | 32 / 40 | 600 | Login heading, success summary count |
| `source` (serif) | 17 / 28 | 400 | Transcript text. Serif gets looser leading |

Rules: sentence case everywhere. Column headings use `text-xs`, weight 500, `slate` color, sentence case (no all-caps). Maximum line length 75 characters for prose.

### 3.3 Spacing, radius, elevation

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48. Page padding 24 on desktop, 16 on mobile.
- **Radius:** cards 10, inputs and buttons 8, chips and avatars fully round, tables 0 inside their card. Different elements, different radius, on purpose.
- **Elevation:** none by default (1 px `line` border). One shadow, for the correction drawer on mobile and menus: `0 8px 24px rgba(23, 33, 43, 0.12)`.

### 3.4 Motion

| Where | Motion | Duration |
|---|---|---|
| Submit transcript | Button label swaps to progress text; thin indeterminate bar slides along the top of the result pane | Loops while waiting |
| Success | The result pane's summary appears with a single 150 ms fade | Once |
| Validation issue focus | Clicking an issue scrolls to and briefly highlights its field (marigold-tint, 600 ms) | 600 ms |
| Everything else | No entrance animations, no hover transforms. Hover changes color only | n/a |

`prefers-reduced-motion: reduce` replaces the sliding bar with a static "Working…" label and removes the fade.

---

## 4. Layout and Navigation

### 4.1 App shell

```
┌───────────────────────────────────────────────────────────────┐
│ NovaWorks            Projects  Team  [Create from transcript]  │  ← top bar, 56px
│                                              Ayesha Khan  ▾    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   Page title                                                  │
│   ───────────────────────────────────────────────────────    │
│   content (max width 1120px, centered column,                 │
│   text and tables left-aligned)                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

A top bar (no sidebar) keeps the layout simple and mobile-friendly. Content is left-aligned. Numbers in tables are right-aligned.

### 4.2 Navigation per role

| Role | Top-bar links | Home |
|---|---|---|
| Admin | Projects, Team, **Create from transcript** (primary button) | All projects |
| Manager | My projects, Team | My projects |
| Agent | My tasks, Team | My tasks |

The account menu (name + chevron) holds **Log out**. The current role is shown as small `slate` text under the user's name (for example, "Manager · Web PM").

### 4.3 Responsive behavior

| Width | Behavior |
|---|---|
| ≥ 1024 | Project cards in a 3-column grid; transcript workspace is two panes |
| 640–1023 | 2-column grid; transcript workspace stacks (transcript above, result below) |
| < 640 | 1 column; task table becomes stacked task cards; top-bar links collapse into a menu button |

---

## 5. Screens

### 5.1 Login

```
┌──────────────────────────────────────────┐
│                                          │
│   NovaWorks                              │
│                                          │
│   Sign in                                │
│   Use your NovaWorks account.            │
│                                          │
│   Email                                  │
│   [______________________________]       │
│   Password                               │
│   [______________________________]       │
│                                          │
│   [ Sign in ]                            │
│                                          │
│   ┌ Demo accounts ──────────────────┐    │
│   │ admin@novaworks.example         │    │
│   │ ayesha@novaworks.example        │    │
│   │ ali@novaworks.example           │    │
│   │ Password for all: Demo123!      │    │
│   └─────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

- Single centered column, 400 px wide, on `paper`. Form sits on a `surface` card.
- A "Demo accounts" box is shown for judges. Clicking an email fills the form. Remove or hide it outside the demo environment.
- Error: "Email or password is incorrect." in a `brick-tint` banner above the button. The message is identical for unknown email and wrong password.
- Button shows "Signing in…" and is disabled while the request runs.

### 5.2 Admin home (all projects)

```
Projects                                         [ Create from transcript ]
3 projects · 12 tasks

┌▌UrbanCart Website ──────┐ ┌▌QuickServe Mobile App ──┐ ┌▌HelpDeskPro AI ────────┐
│ UrbanCart Clothing      │ │ QuickServe Services     │ │ HelpDeskPro Solutions  │
│                         │ │                         │ │                        │
│ Manager  Ayesha Khan    │ │ Manager  Bilal Ahmed    │ │ Manager  Hina Malik    │
│ Deadline 20 Oct 2026    │ │ Deadline 24 Oct 2026    │ │ Deadline 22 Oct 2026   │
│ 4 tasks · 40 hours      │ │ 4 tasks · 46 hours      │ │ 4 tasks · 38 hours     │
└─────────────────────────┘ └─────────────────────────┘ └────────────────────────┘
```

(▌ = 4 px project-color left edge.)

- **Project card contents:** project name (`text-lg`), client name (`slate`), manager, deadline, task count and total hours. Total hours are optional per the pack but cheap and helpful for verification.
- The whole card is one link to the project detail. Hover changes the border to `lagoon`. Focus shows the standard focus ring.
- Dates use the format `20 Oct 2026` everywhere.
- **Empty state (no projects yet):** heading "No projects yet", text "Paste a meeting transcript and NovaWorks creates the projects and tasks for you.", primary button "Create from transcript".

### 5.3 Create from transcript (the memorable screen)

```
Create from transcript
Paste the full meeting transcript. Projects and tasks are created from the final decisions.

┌─ Transcript ──────────────────────────┐ ┌─ Result ───────────────────────────┐
│ Meeting: NovaWorks Client Delivery    │ │                                    │
│ Planning                              │ │   Nothing created yet.             │
│ Date: 7 October 2026                  │ │                                    │
│                                       │ │   The result appears here after    │
│ 09:00-09:04 | Opening and company…    │ │   you click Create from            │
│ Ayesha: Good morning. We have three   │ │   transcript.                      │
│ client engagements to plan today…     │ │                                    │
│                                       │ │                                    │
│ (serif, 17/28, scrolls inside pane)   │ │                                    │
│                                       │ │                                    │
│ 1 line · 9,214 characters             │ │                                    │
└───────────────────────────────────────┘ └────────────────────────────────────┘
                                          [ Create from transcript ]
```

**Layout:** two equal panes on desktop, `surface` cards with `line` borders. The left textarea fills the available height (min 480 px) and uses the serif `source` style. Character count sits under the textarea in `text-xs slate`.

**Pane header text:** "Transcript" (left), "Result" (right), `text-lg`.

**Button:** primary, bottom-right under the panes. Disabled when the textarea is empty (helper text: "Paste a transcript to continue.").

#### Result pane states

| State | Left pane | Right pane |
|---|---|---|
| **Idle** | Editable | Empty message (above) |
| **Working** | Read-only, slightly dimmed | Indeterminate bar along the top; text "Reading the transcript and matching people from the team directory…" Button reads "Creating…" and is disabled |
| **Success** | Read-only | Summary (see below) |
| **Needs correction** | Read-only, still visible | Issue list with inline fixes (see 5.4) |
| **AI error** | Editable again | `brick-tint` banner (see copy table) with "Try again" |

**Success summary**
```
┌─ Result ───────────────────────────────────┐
│ ✓ 3 projects and 12 tasks created          │   ← fern, text-2xl for the counts
│                                            │
│ ▌UrbanCart Website            4 tasks  40 h │
│ ▌QuickServe Mobile App        4 tasks  46 h │
│ ▌HelpDeskPro AI Assistant     4 tasks  38 h │
│                                            │
│ [ View projects ]                          │
└────────────────────────────────────────────┘
```
Each row links to its project. After success, "Create from transcript" changes to "Start a new transcript" (clears both panes).

### 5.4 Needs correction (validation issues)

Triggered when the AI draft fails validation. **Nothing has been saved**, and the screen says so.

```
┌─ Result ───────────────────────────────────────────────┐
│ ⚠ Nothing was saved. 2 fields need your input.          │   ← brick-tint banner
│                                                         │
│ QuickServe Mobile App › Mobile integration and testing  │
│ Assigned to                                             │
│ [ Choose a developer          ▾ ]                       │
│ We couldn't match "Kamran" to anyone in the team.       │
│                                                         │
│ HelpDeskPro AI Assistant                                │
│ Project deadline                                        │
│ [ 2026-10-3_ ]                                          │
│ 31 Oct is not a valid date. Use YYYY-MM-DD.             │
│                                                         │
│ [ Check and save ]                                      │
└─────────────────────────────────────────────────────────┘
```

- Each issue shows: breadcrumb path (project › task), the field label, an appropriate control, and one plain-language reason.
- Controls: developers dropdown (agents only), managers dropdown (managers only), date picker, number input.
- Field-level problems get a `marigold-tint` background on the field container and a 2 px `marigold` left edge.
- A count in the banner ("2 fields need your input") updates as fixes validate.
- "Check and save" runs revalidation without a new AI call. If it passes, the screen switches to Success.

### 5.5 Project detail

```
← Projects

▌UrbanCart Website
Client: UrbanCart Clothing

Manager     Ayesha Khan
Deadline    20 Oct 2026
Total       40 estimated hours across 4 tasks

Description
Responsive website for browsing products, viewing product details and adding items
to a demo cart. Real payments and inventory integration are not included.

Tasks
┌──────────────────────────────┬──────────────────────────────┬───────────┬───────────┬───────┐
│ Task                         │ Description                  │ Assigned  │ Due       │ Hours │
├──────────────────────────────┼──────────────────────────────┼───────────┼───────────┼───────┤
│ Product catalog UI           │ Product listing, detail and  │ Ali Raza  │ 12 Oct    │    12 │
│                              │ responsive layout.           │           │           │       │
│ Demo cart UI                 │ Add and remove items, qty…   │ Ali Raza  │ 15 Oct    │     8 │
│ Product and cart APIs        │ Product data, demo cart…     │ Hamza Shah│ 14 Oct    │    14 │
│ Website integration & testing│ Connect screens, check the…  │ Ali Raza  │ 19 Oct    │     6 │
└──────────────────────────────┴──────────────────────────────┴───────────┴───────────┴───────┘
```

- **Header block:** project color dot + project name (`text-xl`), client under it in `slate`, then a definition-style list for manager, deadline, total.
- **Task table columns:** Task (title), Description (truncate to 2 lines, expand on click or show in full on desktop), Assigned (name with a small initials avatar), Due (day + month; add the year only when it differs from the project deadline year), Hours (right-aligned, tabular).
- Sorted by due date ascending (default).
- **Role scoping on this screen**
  - Admin and manager: all tasks.
  - Agent: only their own tasks. A line under the table heading reads "Showing your tasks in this project." Other agents' tasks are not mentioned.
- **Optional extra, the deadline rail.** A thin horizontal date axis above the table from the earliest task due date to the project deadline. Each task is a small marigold dot; the project deadline is a taller marker. Hover or focus shows the task name and date. It is a deadline view, not a progress view. Build only if time remains.
- **Mobile:** table becomes stacked cards (title, description, then a row of assigned / due / hours).

### 5.6 Manager home (my projects)

Same card grid as 5.2, scoped to the manager's projects, and no "Create from transcript" button.
- Page title: "My projects".
- Empty state: "No projects are assigned to you yet. Projects appear here after the admin creates them from a meeting."

### 5.7 Agent home (my tasks)

```
My tasks
3 tasks · 26 estimated hours

▌UrbanCart Website · Manager: Ayesha Khan
┌────────────────────────┬─────────────────────┬──────────┬───────┐
│ Task                   │ Description         │ Due      │ Hours │
│ Product catalog UI     │ …                   │ 12 Oct   │    12 │
│ Demo cart UI           │ …                   │ 15 Oct   │     8 │
│ Website integration…   │ …                   │ 19 Oct   │     6 │
└────────────────────────┴─────────────────────┴──────────┴───────┘
```

- Tasks are grouped by project. Each group header shows the project name (link to its detail) and manager, because an agent may see the related project name and manager.
- A developer with tasks in two projects (Hamza) sees two groups.
- No assignee column (it is always the viewer).
- Empty state: "Nothing is assigned to you yet."

### 5.8 Team directory (read-only)

```
Team
┌───────────────────┬────────────────┬──────────────────────┐
│ Name              │ Role           │ Specialization       │
├───────────────────┼────────────────┼──────────────────────┤
│ Ayesha Khan       │ Manager        │ Web PM               │
│ Bilal Ahmed       │ Manager        │ Mobile PM            │
│ Hina Malik        │ Manager        │ AI PM                │
│ Ali Raza          │ Developer      │ Full-Stack           │
│ …                 │                │                      │
└───────────────────┴────────────────┴──────────────────────┘
```

- Group order: managers, then developers. The admin account is not listed (or shown as "Administrator" at the bottom if you prefer).
- No emails, skills, or edit controls. The page has no buttons.
- Use "Developer" in the UI for the AGENT role, since that is the word the company uses. The database role value stays `AGENT`.

### 5.9 Access denied / not found

- Opening a project outside your scope shows the same page as a project that doesn't exist: heading "Project not found", text "It may not exist, or it isn't one of yours.", link "Back to your projects".
- No hint about who owns it.

---

## 6. Components

| Component | Description | Notes |
|---|---|---|
| `AppBar` | Logo text, role-based links, account menu | 56 px high, `surface`, bottom border |
| `Button` | Primary (filled `lagoon`, white text), Secondary (`surface`, `line` border, `ink` text), Quiet (text only, `lagoon`) | 40 px high, 8 px radius, 16 px horizontal padding. Disabled: 50% opacity and `not-allowed` |
| `TextField` / `Textarea` | Label above, helper text below | 40 px high; 1 px `line` border; focus: 2 px `lagoon` ring |
| `Select` | Native `<select>` styled to match | Native is cheaper and accessible |
| `ProjectCard` | 4 px project-color left edge, name, client, manager, deadline, counts | Entire card is a link |
| `TaskTable` | Table with sticky header, row hover `lagoon-tint` | Stacks to cards under 640 px |
| `TaskGroup` | Project header + table (agent home) | |
| `Avatar` | 24 px circle with initials, `lagoon-tint` background, `lagoon-dark` text | Decorative; name is always adjacent |
| `Banner` | Success (`fern` text on white with `fern` left edge), Warning (`marigold-tint`), Error (`brick-tint`) | Icon + text; `role="alert"` for error, `role="status"` for success |
| `IssueField` | Breadcrumb, label, control, reason text | Used only in the correction view |
| `EmptyState` | Heading, one sentence, one action | |
| `ProgressBar` (indeterminate) | 3 px bar at the top of the result pane | Used only while the AI is working; not a progress indicator |
| `DemoAccountsBox` | Click-to-fill list on login | Demo only |

### 6.1 Buttons: one action, one name

Use the same verb everywhere an action appears.

| Action | Label | Loading label | Result message |
|---|---|---|---|
| Start AI conversion | Create from transcript | Creating… | "3 projects and 12 tasks created" |
| Save corrected fields | Check and save | Checking… | Same success summary |
| Sign in | Sign in | Signing in… | n/a |
| Sign out | Log out | n/a | Return to login |

---

## 7. Copy Guide

**Voice:** plain, direct, sentence case, active voice. Name things the way staff do: projects, tasks, developers, hours. Don't expose system terms (JSON, validation, payload, assignee ID). Errors explain what went wrong and what to do next. They don't apologize.

| Situation | Message |
|---|---|
| Wrong login | Email or password is incorrect. |
| Empty transcript | Paste a transcript to continue. |
| Working | Reading the transcript and matching people from the team directory… |
| Success | 3 projects and 12 tasks created. |
| Validation failed (banner) | Nothing was saved. {n} fields need your input. |
| Unknown person | We couldn't match "{name}" to anyone on the team. Choose a developer. |
| Bad date | {value} isn't a valid date. Use YYYY-MM-DD. |
| Task after project deadline | This task is due after the project deadline ({date}). Change one of the dates. |
| Hours not positive | Estimated hours must be more than 0. |
| AI service failure | The AI service didn't respond. Nothing was saved. Try again. |
| AI output unreadable | We couldn't read the AI's answer. Nothing was saved. Try again, or check that the transcript is complete. |
| Duplicate in-flight request | A transcript is already being processed. Wait for it to finish. |
| Not allowed (admin-only action) | Only the administrator can create projects from a transcript. |
| Project not in scope | It may not exist, or it isn't one of yours. |
| Empty agent list | Nothing is assigned to you yet. |

---

## 8. Role-Specific Experience Summary

| | Admin | Manager | Agent (Developer) |
|---|---|---|---|
| Home | All projects | My projects | My tasks |
| Create from transcript | Yes | Not shown | Not shown |
| Project detail | All tasks | All tasks (own projects) | Own tasks only |
| Team directory | Yes | Yes | Yes |
| Nav items | Projects, Team, Create from transcript | My projects, Team | My tasks, Team |

Hidden UI is a convenience only. The server enforces every rule (see `Architecture.md` §8).

---

## 9. Accessibility Requirements

- **Contrast:** at least 4.5:1 for text, 3:1 for icons and focus rings. `marigold` is used only for markers and backgrounds, never as text on white.
- **Keyboard:** every control reachable and operable by keyboard. Logical tab order. A visible 2 px `lagoon` focus ring with 2 px offset on every interactive element.
- **Screen readers:** semantic landmarks (`header`, `nav`, `main`); `<table>` with `<th scope>` for task tables; project color dots are `aria-hidden` because the name is adjacent.
- **Live regions:** success summary `role="status"`; errors and validation banners `role="alert"`; the working state announces "Creating projects and tasks".
- **Forms:** every input has a visible `<label>`; error text linked via `aria-describedby`; invalid fields have `aria-invalid="true"`.
- **Targets:** buttons and links at least 40 px tall (44 px on touch).
- **Motion:** respect `prefers-reduced-motion`.
- **Language:** `<html lang="en">`. Don't rely on color alone (icons and text accompany every status color).

---

## 10. Implementation Notes (Tailwind + Next.js)

**Fonts**
```ts
// app/layout.tsx
import { Schibsted_Grotesk, Newsreader } from "next/font/google";
const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });
```

**Tailwind theme extension**
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      paper: "#F3F5F6", surface: "#FFFFFF", ink: "#17212B", slate: "#5B6975",
      line: "#D9DFE4",
      lagoon: { DEFAULT: "#0E6B73", dark: "#0A545B", tint: "#E3F1F2" },
      marigold: { DEFAULT: "#D98E04", tint: "#FCF3DC" },
      brick: { DEFAULT: "#B3261E", tint: "#FBE9E7" },
      fern: "#2E7D4F",
    },
    fontFamily: {
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      serif: ["var(--font-serif)", "Georgia", "serif"],
    },
    borderRadius: { card: "10px", control: "8px" },
  },
}
```

**Project hue helper**
```ts
export const PROJECT_HUES = ["#3B5BDB","#C2255C","#2F9E44","#E8590C","#7048E8","#0C8599"];
export const hueFor = (index: number) => PROJECT_HUES[index % PROJECT_HUES.length];
```

**Transcript textarea**
```tsx
<textarea className="font-serif text-[17px] leading-7 min-h-[480px] w-full rounded-control border border-line p-4 focus:outline-none focus:ring-2 focus:ring-lagoon" />
```

**Formatting helper** (dates for display)
```ts
const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// "2026-10-20" → "20 Oct 2026"
```

---

## 11. Build Priority (3-hour reality)

| Priority | Item | Notes |
|---|---|---|
| Must | Login, app bar, role-based homes | Plain Tailwind, no component library needed |
| Must | Transcript workspace with working, success, AI-error states | Core demo moment |
| Must | Project card grid, project detail, task table | Minimum screens per the pack |
| Must | Agent My tasks grouped by project | |
| Must | Team directory | Simple table |
| Must | Not-found page for out-of-scope projects | Shows server-side scoping |
| Should | Needs-correction view with inline fixes | Required by the PRD, can start as a read-only issue list plus "edit transcript and retry" |
| Should | Total hours on cards and detail | Quick to compute and useful for verification |
| Could | Demo accounts box on login | Handy for judges, minimal work |
| Could | Deadline rail on project detail | Only if the rest is done |
| Could | Mobile stacked task cards | Basic responsive layout comes first |

---

## 12. Design QA Checklist

- [ ] Transcript text is serif; all record data is sans
- [ ] Only one primary button visible per screen
- [ ] No disabled or greyed-out controls for features a role can't use
- [ ] Loading, success, empty, and error states exist for the transcript screen
- [ ] Every table has right-aligned, tabular hours
- [ ] Project name always appears next to its color dot
- [ ] Dates use `20 Oct 2026` format consistently
- [ ] All interactive elements show a visible focus ring
- [ ] Layout holds at 360 px, 768 px, and 1280 px
- [ ] Out-of-scope project URL shows the "not found" page with no ownership hint
- [ ] No cost, progress, chart, or percentage UI anywhere
