# How I worked with AI

## How I used the tool

I built this with **Claude Code** as a pair programmer: it planned with me, wrote code and tests, and walked me through
deployment. I kept the product decisions, checked every change myself in the running app before it was committed, and
handled accounts and secrets myself. After each feature it explained the code, and I made sure I could explain it back.
To keep long sessions on track, we kept a running summary and a handoff note at the end of each session.

## The process

**1. Plan.** I pasted the brief and asked for a plan before any code. The first question was what the product is:
a quick, personal daily briefing. "Sections based on preferences" was ambiguous, so we decided all four sections always
show, with personalised content and order. I asked to deploy a skeleton on day 1, so hosting problems would show up early.

**2. Skeleton and auth.** We compared keeping the login token in the browser's storage with a secure cookie. I chose the
cookie (safer), and the AI showed how to make it work across Vercel and Render by serving the API from the same domain.
When Docker wouldn't start, I asked whether we needed it at all, understood what it gave us (a real local and test
database), and kept it.

**3. Dashboard.** CryptoPanic, the suggested news API, turned out to be paid-only. The AI offered static sample news or
free RSS feeds; I chose RSS so the news stays live. When the AI insight kept showing "Sample", we tested the free models
one by one instead of guessing, and found they were either rate-limited or using their whole answer on "thinking".

**4. Using it myself.** Most improvements came from my own testing. "The votes just sit there": now a 👎 hides a story or
swaps the meme. "The articles are old": we merged three news feeds. "What happens when the day switches?": crypto has no
market hours, but the question exposed a real bug (the insight changed day at UTC midnight, not mine). For coin graphs I
chose a 7-day chart from data we already had over new API calls, to avoid rate-limit risk close to the deadline.

**5. Review.** I asked for a review as if this were a team project: design patterns, code smells, duplication, and a
comment on every function saying what it does and what uses it. It found real bugs, such as a signup race and votes
that could be saved out of order, and each was fixed with a test before it was committed.

## What I took away

The AI is fast at producing a working first version, and good at explaining it. The things that mattered most, though,
came from using the app and questioning its answers: the time-zone bug, votes that did nothing, a reason for a decision
that didn't hold up. I treat its code as a draft that I review, test and understand before it goes in.
