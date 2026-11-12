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

**Deploying the skeleton (Neon → Render → Vercel).** I created the accounts myself; the AI wrote the config
(`render.yaml`, `client/vercel.json`) and talked me through each dashboard. Things that went wrong, and the fixes:
- Neon's setup wizard offered extras (auth, storage, an AI gateway). We picked "just Postgres", because we already
  have our own auth and use OpenRouter for AI.
- Neon's "add to app" snippet wanted to install its CLI and write secrets into a local file. We skipped it,
  because the connection string only needs to live in Render's environment settings, not on disk or in chat.
- I pasted the connection string into Render's *Blueprint Path* field by mistake, so the deploy looked for
  a file with that name. A screenshot also exposed the password in our chat, so I rotated it in Neon before using it.
- Vercel served 404s at first because the project had been created from the repo root. Setting the Root Directory to
  `client` (without `./`) and redeploying fixed it.

Result: https://cryptovisorai.vercel.app is live. `/api/*` on that domain goes through Vercel's rewrite to Render,
so the auth cookie is first-party, as designed.

**Onboarding quiz.** Design choices, applying the HiWay lessons:
- The answer options live on the server and the client fetches them, so the UI and the validation can't disagree.
- The three steps are an array of data rendered by one page, not three copy-pasted components.
- Answers stay in the quiz component's local state and are saved in a single request at the end.

A bug the tests caught: the second client test failed with "found multiple buttons", because Testing Library
wasn't cleaning up between tests (that cleanup is automatic only with vitest globals). We added an explicit
`cleanup` in the test setup.
Verified in the browser: three steps, Next disabled until answered, one PUT, redirect to the dashboard,
and the row in Postgres matches what was picked.

**A "bug" that wasn't.** While testing, I reported "HODLer" as a typo for "HOLDer". The AI pointed out that it's
intentional crypto slang (from a 2013 forum post, "I AM HODLING"), and that the assignment itself uses this spelling.
We kept it.

**Scoping the login polish.** I suggested an email confirmation, a way back to sign-in from signup, and a password
strength meter. We weighed each against the brief ("clean UX, readable code, good structure") and against the
reviewers' experience:
- Email confirmation would make reviewers check an inbox before seeing the dashboard, so it moves to
  "what I'd add for production".
- The sign-in link already existed but was easy to miss, so it gets a visibility fix.
- The strength meter has low value with a minimum of 8 characters. A show/hide toggle and a "waking up the server"
  message, for Render's cold start, matter more.
All of these go on Saturday's polish list, so the dashboard comes first.

## Day 2 (Friday, started Thursday evening): the dashboard

**Checking the free APIs before writing code against them.** CoinGecko and the meme proxy work without a key.
CryptoPanic and CoinDesk both need keys, and OpenRouter has 13 free models. So: news is CryptoPanic with a static
fallback (the spec allows it), and the LLM model list is configuration, because free models come and go.

**Design choices:**
- One endpoint and one card per section, so one slow source doesn't block the page.
- Each external API is wrapped in a provider that maps its response to our own type and owns the fallback.
- Responses say `live` or `fallback`, and the UI shows a "Sample" badge on fallback data, so we never pass
  sample content off as live.
- No fallback for prices: a made-up price in a finance app is worse than an error.
- The daily insight is stored with the exact prompt and model that produced it.
- Votes store a snapshot of what the user saw plus their preferences at that moment, because items rotate,
  and a bare id would be useless as training data later.
- The feedback is used once immediately: memes you vote down never come back.

**Verified:** 28 server tests (external APIs are faked per host, so the tests never touch the internet) and 10 client
tests. In the browser: live prices with sparklines, a live Reddit meme, fallback news and insight (no keys locally),
the sections ordered by my preferences, and a 👍 stored in Postgres with the full snapshot.

**CryptoPanic's free API key is gone.** When I went to get the key, CryptoPanic's API dashboard said
"To start using API, please upgrade to a Paid API Plan". The assignment lists it under "Suggested **Free** APIs",
so it was probably written before CryptoPanic dropped its free tier. I asked the AI which option the assignment
recommends. Its answer: the letter of the spec allows "CryptoPanic API or static fallback", but the intent is free, live
news. We chose to keep the CryptoPanic adapter as an optional first source and add Cointelegraph's free RSS feed as the
live source, with the built-in explainers as the last fallback (decision 26). Because each source is its own adapter,
this was one new file and one line in the news orchestrator.
Two bugs the tests caught while adding RSS:
- My ranking change briefly let explainers about *other* coins through as "general news". We restored the rule that
  only untagged stories count as general.
- One of my test expectations was wrong about XML: text inside `CDATA` is literal, so `&amp;` stays `&amp;`.
  Real feeds also use entities in plain titles, so we enabled HTML entity decoding and tested that case instead.

**Making the AI insight actually live.** With my OpenRouter key, the insight still showed the fallback. The server log
said "the model returned no text". The AI wrote a small probe script (printing only status codes and lengths, never the
key) and found two causes: both Gemma models were rate-limited (429), and Nemotron is a reasoning model that spent its whole
token budget "thinking". Sending `reasoning: { enabled: false }` and putting the fast models first fixed it (decision 27).
The insight now comes from a real model and refers to the real prices.

**A secret-handling slip, and the fix.** I had pasted the OpenRouter key into `.env` on a line without the
`OPENROUTER_API_KEY=` prefix. The AI's command for listing variable *names* only masked `NAME=value` lines, so the bare
key line was printed into our chat. It never reached git (`.env` is ignored), but a key that has appeared in a chat log counts as exposed, so I rotated it and updated both `.env` and Render. The AI then
added the missing prefix in place without printing anything. Lesson: when a value might be malformed, check its shape
(for example, count matching lines) instead of printing a "masked" view.

**Mobile layout bug found in the browser, not by the tests.** At phone width the page scrolled sideways. Measuring element
widths showed the cards were 800px wide: a CSS grid column grows to its widest content, here a meme image's
natural width. The fix: `grid-cols-1` (a column allowed to shrink), `min-w-0` on the cards, and hiding the sparkline
on very narrow screens.

**My review of the live dashboard.** Using it myself, I raised six points. The AI answered each, and I chose what to build:
- *"Is news sorted by relevance?"* Yes: your coins first, then general news, so a 17-minute-old Ethereum story sits
  at the bottom for a BTC/SOL user.
- *"Why are the articles so old?"* The AI measured four free feeds: each carries only about 7-8 Bitcoin stories over
  1-2 days. So we merged three feeds (decision 28). Five of the eight stories are now under 5 hours old.
- *"Remove the emojis, rename to Memes."* Done.
- *"Where do the votes come into play? They just stay there."* A good product point. Now a 👎 on a story collapses it
  with Undo and hides it for good, and a 👎 on a meme loads a new one (decision 29). I asked whether that could run
  the user out of content: no, because the feeds refresh and memes fall back to the full pool.
- *"Should prices show only my coins, or the day's big movers?"* Both, as two lists, from one shared API call
  (decision 30).

Bugs found while building this: a **cache stampede**, caught by a test (two parallel lookups each called CoinGecko,
decision 31); an invalid `aria-labelledby` (the ids were built from titles containing spaces); and a blank page in
development, caused by the dev server serving a stale module after an edit landed in two steps, which a server restart fixed.

**A logout bug I found by clicking around.** Logging out on the live site left me on the dashboard, with every card
saying "Not signed in" instead of showing the login page. It had been there since day 1, and our guard tests didn't
cover logout. The cause: `useLogout` called `queryClient.clear()` and *then* set the user to `null`. `clear()` deletes
the cached "me" query that the mounted route guard is subscribed to, so the guard never saw the sign-out, while the four
cards refetched without a cookie. The fix:
- set the user to `null` first (the guard redirects), then remove every other cached query;
- a global safety net: any 401 from any request signs the user out locally, so an expired session behaves the same way.
I asked for a test that reproduces it. To prove the test isn't passing by accident, the AI temporarily restored the old
order: both new tests failed, exactly like my screenshot. Then it put the fix back.

**Design pass from my own testing.** A new account showed a broken meme image, and "Another one" fixed it. The AI
explained that the server had picked a Reddit post whose image no longer loads, so the client now loads another meme on an
image error, capped at 3 tries (decision 37, with a test). I also asked for:
- distinct titles: accent colour and a highlighted name in the greeting;
- green and red votes: SVG thumbs, since emoji can't be recoloured;
- the whole dashboard on one screen, instead of scrolling down to the meme.
The one-screen layout showed a new problem at laptop size: the prices column became too narrow, and coin names were cut
to "B…". The fix was a CSS container query, so the sparkline hides based on the card's width rather than the screen's
(decisions 34-36). Checked at 1440×900 (no page scroll) and at 375px (normal scroll, no sideways overflow).

**CoinGecko key?** We never needed one. The public `/coins/markets` endpoint works without a key, and with a 60-second
cache we make at most one call per coin set per minute. The code accepts an optional free "demo" key
(`COINGECKO_API_KEY`) as insurance against rate limits on Render's shared IP addresses.
