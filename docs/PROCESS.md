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

1. **Plan:** the stack (React, Node/Express, PostgreSQL) and deploying a skeleton on day 1 to catch problems early.
2. **Skeleton and auth:** sign-up and login with a secure cookie, tested against a real database.
3. **Deploy:** Vercel (frontend), Render (API), Neon (database).
4. **Onboarding:** the 3-question quiz, saved as the user's preferences.
5. **Dashboard:** prices, news, AI insight and meme, each with a fallback if its source is down.
6. **Feedback:** 👍/👎 stored with what the user saw, ready for future training.
7. **Polish from using it:** editing preferences, the day following the user's time zone, price times, coin charts,
   a friendlier login.
8. **Bonus and DB access:** the training suggestion, and a read-only database login for reviewers.
9. **Self-review:** bugs fixed, duplicated code removed, docs cut down to what's needed.

## Where I steered the AI

- **CryptoPanic is paid-only now,** so we switched news to free RSS feeds.
- **The AI insight kept falling back to "Sample":** we traced it (rate-limited models, then a missing key on the server).
- **Scope:** ungraded extras like email confirmation went on the "for production" list.
- **Secrets:** when a key or password showed up in our chat, I rotated it and we changed how secrets are checked.
