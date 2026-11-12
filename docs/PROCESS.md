# Working with AI on this assignment

I built this project with **Claude Code** (Anthropic's coding agent) as a pair programmer.
This file summarizes the important interactions and the thinking behind them, written as we went
rather than reconstructed at the end.

## How I set up the collaboration

Before seeing the task, I set ground rules based on feedback from a previous take-home:

- **Lessons carried over** from a previous review, turned into a checklist the AI must check its own code against:
  group state by how often it changes, extract duplicated code the second time it appears, use events instead of polling,
  document exported functions, validate input, and test the logic that can actually break.
  In that earlier project, most of the reviewer's critiques landed on code the AI had written,
  so I treat AI output as a draft that needs a review pass, not as finished code.
- **Understanding over speed, within reason:** I must be able to explain every file in the review.
  After each feature the AI explains it briefly and I check I could explain it back.
  Rule: if a detail would take more than about 15 minutes and is unlikely to matter, log it and move on.
- **A decision log** ([DECISIONS.md](DECISIONS.md)) kept as we decide, not after.

## Day 1 (Thursday): planning, scaffold, auth

**Planning.** I pasted the assignment and the AI proposed a plan. Choices I made, and why:
- TypeScript over JavaScript: it's standard for this kind of role, and types document the data.
- Tailwind for styling, so the UI could look clean quickly.
- Neon Postgres instead of Render's database, because Render's free database expires after 30 days
  and reviewers need DB access after I submit.
- Deploy a skeleton on day 1, so deployment problems show up early, not on Sunday.

**Auth design discussion.** We compared storing the JWT in localStorage with storing it in an httpOnly cookie.
The cookie is safer against XSS, but a cookie between two different domains (Vercel and Render) needs
`SameSite=None` and runs into third-party cookie blocking. The fix: make the browser see one origin.
A Vercel rewrite forwards `/api/*` to Render in production, and a Vite proxy does the same locally.

**Interpreting the spec.** "Display 4 sections based on user preferences" is ambiguous. We decided that all
4 sections always show, but their content is personalized: prices and news follow the chosen coins, the AI insight is
prompted with the investor type, and the content types change the section order. (See DECISIONS.md.)

**Corrections along the way:**
- `prisma init` dropped AI-agent skill folders (`.agents/`, `.windsurf/`, etc.) into the project. We removed them
  so the repo holds only project code.
- npm installed a release-candidate Prisma CLI that didn't match the client version. We pinned both to 7.10.1.
- Docker wouldn't start. I asked *why we need Docker at all*. The AI explained that it only provides a local
  Postgres and a throwaway test database, and offered Neon branches as a no-install alternative.
  I chose to keep Docker, because a local DB is the more standard setup and keeps the tests fast and offline.
  The root cause was that WSL wasn't installed. I installed it (a system change, so I did it myself, not the AI)
  and Docker came up.

**Verified at end of day 1:** 7 server API tests and 3 client guard tests pass against the real local Postgres.
A manual signup in the browser showed field errors on an empty submit, then created the user,
redirected to onboarding, kept the session after a reload, and stored a bcrypt hash in the database
(no plain-text password). The token cookie is invisible to page JavaScript (httpOnly).
