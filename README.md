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

## Docs

- [Decision log](docs/DECISIONS.md)
- [Code walkthrough](docs/WALKTHROUGH.md)
- [How I worked with AI](docs/PROCESS.md)
