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

## Where I steered the AI

- **"Where do the votes come into play? They just stay there."** Votes were only being recorded. Now a 👎 hides a
  story or swaps the meme, so feedback visibly does something.
- **"The market works certain hours, what happens when the day switches?"** Crypto has no market hours, but the
  question exposed a real bug: the insight changed day at UTC midnight while the header used my local date.
- **"Why are the articles so old?"** One RSS feed carried only a few stories per coin, so we merged three feeds.
- **A logout bug I found by clicking around.** I asked for a test that reproduces it, and for proof that the test
  fails without the fix, so the test actually guards against it.
- **Graphs on the coins:** of the two options, I chose the 7-day chart built from data we already had over
  24h/30d ranges, which would have meant new API calls and rate-limit risk two days before the deadline.
- **Questioning the AI's reasoning:** it justified choosing Neon by Render's 30-day database expiry, which doesn't
  matter for a 1–3 day assignment. The real reasons are simpler (free Postgres, a built-in SQL editor for the reviewer login).
- **Keeping it simple:** I turned down extras that weren't asked for (a status endpoint), and cut the docs from about
  740 lines to what the brief asks for.
- **Setting the review bar:** I asked for the code review to cover design patterns, code smells, duplication and a
  comment on every function, as if this were a team project.
