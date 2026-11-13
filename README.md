# AI Crypto Advisor

A personalised daily crypto dashboard. Sign up, answer three quick questions, and get your briefing:
prices for your coins, news about them, an AI-written insight of the day, and a meme.
Rate anything with 👍/👎; your votes are stored to improve future recommendations.

**Live:** https://cryptovisorai.vercel.app

> Runs on free hosting: if nobody has used it for a while, the first load can take up to a minute while the server wakes up.

## Features

- **Personalised onboarding:** pick your coins, your investor type and what you want to see. Change it any time.
- **Coin prices** with the 24h change, the biggest 24h movers, and a 7-day chart per coin.
- **Market news** about your coins, from CoinDesk, Cointelegraph and Decrypt.
- **AI insight of the day**, written for your coins and investing style.
- **A crypto meme**, because markets are stressful.
- **Feedback that does something:** a 👎 on a story hides it, a 👎 on a meme shows another one.

## Tech

| | |
|---|---|
| Frontend | React, TypeScript, Vite, TanStack Query, Tailwind (on Vercel) |
| Backend | Node, Express, TypeScript, zod, JWT in an httpOnly cookie (on Render) |
| Database | PostgreSQL with Prisma (on Neon) |
| Data | CoinGecko (prices), RSS feeds (news), OpenRouter free models (AI), Reddit via meme-api.com (memes) |

Every external source has a fallback, so the dashboard keeps working (and says so) when one is down.
Nothing here is financial advice.

## Run it locally

Needs Node 22+ and Docker.

```bash
docker compose up -d                                  # local Postgres
cd server && cp .env.example .env                     # set JWT_SECRET; OPENROUTER_API_KEY is optional
npm install && npx prisma migrate dev && npm run dev  # API on http://localhost:4000
cd ../client && npm install && npm run dev            # app on http://localhost:5173
```

Tests: `npm test` in `server/` (uses the Docker database) and in `client/`.

## Database

| Table | What it holds |
|---|---|
| `User` | Account: email, name, password hash |
| `Preferences` | The onboarding answers |
| `DailyInsight` | One AI insight per user per day, with the model and prompt that produced it |
| `Feedback` | Each 👍/👎, with a snapshot of what was shown and the user's preferences at that moment |

Read-only access for reviewers is sent with the submission. Example query:

```sql
SELECT section, count(*) FILTER (WHERE vote = 1) AS up, count(*) FILTER (WHERE vote = -1) AS down
FROM "Feedback" GROUP BY section;
```

## More

- [How I worked with AI](docs/PROCESS.md)
- [Bonus: how the feedback would train the models](docs/FEEDBACK_TRAINING.md)

**Next steps for production:** email verification and password reset, rate limiting on login, revocable sessions,
always-on hosting (no cold start), account deletion, and 24h/30d chart ranges.
