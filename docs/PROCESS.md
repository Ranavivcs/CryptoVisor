# How I worked with AI

I used **Claude Code** as a pair programmer for planning, code, tests and deployment.

## How I worked with it

- **Product first.** Before writing code, we discussed who the user is and what the dashboard is for (a quick,
  personal daily briefing), and used that to decide what to build and what to leave out.
- **Nothing changes without me seeing it.** I checked every feature myself in the browser before accepting it, and
  most improvements came from my own testing (old news, votes that did nothing, the back button, what happens at midnight).
- **Tested before committed.** Every change came with tests and passed them, and was checked in the running app,
  before it was committed.
- **AI code is a draft.** I reviewed it against a checklist from a previous take-home (no duplication, no needless
  complexity, validated input), and ended with a full code review that found and fixed real bugs.
- **I must understand every file.** After each feature the AI explained it, and I made sure I could explain it back.
- **Working notes to manage context.** We kept a running summary of decisions and a handoff file at the end of each
  session, so a new session could pick up exactly where the last one stopped without re-reading everything.
- **Secrets stay with me.** Keys and passwords never went into the code; account and system changes I did myself.

## Process

1. **Plan:** the stack (React, Node/Express, PostgreSQL), and a deployed skeleton on day 1 to catch problems early.
2. **Skeleton, auth, deploy:** sign-up and login with a secure cookie, live on Vercel, Render and Neon.
3. **Core features:** the onboarding quiz, then the dashboard (prices, news, AI insight, meme, each with a fallback)
   and 👍/👎 feedback stored with what the user saw.
4. **Polish from using it:** editing preferences, time zones, price times, coin charts, a friendlier login.
5. **Bonus, DB access, self-review:** the training suggestion, a read-only database login for reviewers, and a full
   code review (bugs fixed, duplication removed, docs cut to what's needed).
