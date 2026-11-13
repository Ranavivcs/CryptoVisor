# AI Crypto Advisor

A personalized crypto investor dashboard. Users sign up, answer a short onboarding quiz, and get a daily
dashboard (market news, coin prices, an AI insight of the day, and a meme), each section with thumbs up/down
feedback stored for future model improvements.

> **Live app:** https://cryptovisorai.vercel.app · **API:** https://cryptovisor-api.onrender.com/api/health · **Status:** in progress
>
> The API runs on Render's free tier, which sleeps after 15 minutes without traffic.
> The first request after that can take about 50 seconds while the server wakes up.

## Stack

| Layer | Tech | Hosted on |
|---|---|---|
| Client | React, Vite, TypeScript, TanStack Query, React Router, Tailwind | Vercel |
| API | Node, Express, TypeScript, zod, JWT (httpOnly cookie) | Render |
| Database | PostgreSQL via Prisma | Neon |

```
Browser ──► Vercel (static React app)
   │  /api/*  (rewrite: same origin, so the auth cookie is first-party)
   ▼
Render (Express API) ──► Neon (Postgres)
                     └─► CoinGecko · CryptoPanic · OpenRouter
```

## Run locally

Needs Node 22+ and Docker.

```bash
docker compose up -d                 # local Postgres on port 5433 (+ a moveo_test DB)
cd server && cp .env.example .env    # then set JWT_SECRET
npm install && npx prisma migrate dev && npm run dev    # API on :4000
cd ../client && npm install && npm run dev              # app on :5173
```

Tests: `npm test` in `server/` (needs the Docker DB) and in `client/`.

## API

All responses are JSON. Errors look like `{ "error": string, "details"?: { field: string[] } }`.

| Method | Path | Auth | Body / notes |
|---|---|---|---|
| GET | `/api/health` | – | `{ ok: true }` |
| POST | `/api/auth/register` | – | `{ email, name, password }` → `201 { user }`, sets cookie. `409` if the email exists |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ user }`, sets cookie. `401` on bad credentials |
| POST | `/api/auth/logout` | – | `204`, clears cookie |
| GET | `/api/auth/me` | ✓ | `{ user }` where `user = { id, email, name, hasPreferences }` |
| GET | `/api/preferences/options` | ✓ | Quiz choices: `{ coins, investorTypes, contentTypes }` |
| GET | `/api/preferences` | ✓ | `{ preferences }`, which is `null` before onboarding |
| PUT | `/api/preferences` | ✓ | `{ assets: string[], investorType, contentTypes: string[] }` → `{ preferences }`. Creates or replaces |
| GET | `/api/dashboard/prices` | ✓ | `{ source, coins: [{ id, symbol, name, image, priceUsd, change24hPct, sparkline, myVote }] }`. `503` if CoinGecko is down and nothing is cached |
| GET | `/api/dashboard/news` | ✓ | `{ source, items: [{ id, title, url, sourceName, publishedAt, coins, myVote }] }` |
| GET | `/api/dashboard/insight` | ✓ | `{ source, insight: { id, text, model, myVote } }`. Generated once per user per day; `?tz=Area/City` sets which day (default UTC) |
| GET | `/api/dashboard/meme` | ✓ | `{ source, meme: { id, title, imageUrl, text, postUrl, myVote } }`. Random on each call |
| PUT | `/api/feedback` | ✓ | `{ section: NEWS\|PRICES\|INSIGHT\|MEME, itemId, vote: 1\|-1, content }`. Creates or changes the vote |
| DELETE | `/api/feedback/:section/:itemId` | ✓ | Removes the vote. `204` |

Every dashboard response has `source: "live" | "fallback"`, and `myVote` is `1`, `-1` or `0` (no vote).

## Where the data comes from

| Section | Live source | When it's unavailable |
|---|---|---|
| Coin Prices | CoinGecko `/coins/markets` (no key needed), cached for 60 s | The last cached prices; otherwise an error card (we never show made-up prices) |
| Market News | Three free RSS feeds merged (Cointelegraph, CoinDesk, Decrypt), tagged by coin, cached for 10 min. CryptoPanic is tried first if `CRYPTOPANIC_API_KEY` is set (its API now requires a paid plan) | Built-in explainer links for the user's coins, marked "Sample" |
| AI Insight | OpenRouter free models (`OPENROUTER_API_KEY`), tried in order from `OPENROUTER_MODELS`, reasoning off; stored once per day | A rule-based insight naming the biggest mover in the user's watchlist |
| Meme | r/cryptocurrencymemes via meme-api.com (NSFW and spoiler posts filtered out) | Built-in text memes |

## Database

Postgres on Neon (Frankfurt), managed with Prisma migrations (`server/prisma/schema.prisma`).
Reviewers get a **read-only** login (the `reviewer` role, sent separately, never in this repo). It can `SELECT`
every table but can't write, and it can't read `User.passwordHash`, so `SELECT *` on `"User"` fails: name the columns.

| Table | One row per | What it's for |
|---|---|---|
| `User` | account | Email, name, bcrypt password hash |
| `Preferences` | user (after onboarding) | The quiz answers: coins (`assets`), investor type, content types |
| `DailyInsight` | user per day (in their time zone) | The AI insight, the model that wrote it, and the exact prompt sent |
| `Feedback` | user per voted item | `vote` (+1 / -1) and `contentSnapshot`: what the user saw plus their preferences at that moment |

Table and column names are camelCase, so quote them in SQL (`"Feedback"`, `"itemId"`).

```sql
-- Votes per section: how many up and down.
SELECT section,
       count(*) FILTER (WHERE vote = 1)  AS up,
       count(*) FILTER (WHERE vote = -1) AS down
FROM "Feedback"
GROUP BY section
ORDER BY section;

-- The 👍 ratio of AI insights, per model.
SELECT d.model,
       count(*) AS votes,
       round(avg((f.vote = 1)::int), 2) AS up_ratio
FROM "Feedback" f
JOIN "DailyInsight" d ON d.id = f."itemId"
WHERE f.section = 'INSIGHT'
GROUP BY d.model;

-- The latest votes, with what was shown and who it was shown to.
SELECT section, vote, "updatedAt",
       "contentSnapshot"->'item'                         AS item,
       "contentSnapshot"->'preferences'->>'investorType' AS investor_type
FROM "Feedback"
ORDER BY "updatedAt" DESC
LIMIT 10;

-- The latest insights and the prompts that produced them.
SELECT day, model, text, prompt
FROM "DailyInsight"
ORDER BY "createdAt" DESC
LIMIT 5;
```

## What I'd add for production

- **Chart ranges (24h / 7d / 30d)** from CoinGecko's `/coins/{id}/market_chart`, cached per coin and range, with a paid
  API key: the free tier allows only a few calls a minute (decision 41).

## Docs

- [Decision log](docs/DECISIONS.md)
- [Code walkthrough](docs/WALKTHROUGH.md)
- [How I worked with AI](docs/PROCESS.md)
- [Bonus: how the 👍/👎 feedback would train or improve the models](docs/FEEDBACK_TRAINING.md)
