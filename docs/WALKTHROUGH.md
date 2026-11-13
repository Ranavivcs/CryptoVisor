# Code walkthrough

One line per file: what it does. Read top to bottom to follow a request from the browser to the database.

## Server (`server/`)

| File | What it does |
|---|---|
| `prisma/schema.prisma` | The data model: User, Preferences, DailyInsight, Feedback, plus enums. Prisma generates a typed client from it |
| `prisma.config.ts` | Tells the Prisma CLI where the schema and migrations are and which DB URL to use |
| `src/index.ts` | Starts the HTTP server. Nothing else |
| `src/app.ts` | Builds the Express app: JSON and cookie parsers → routes → 404 → error handler. Separate from `index.ts` so tests can use it without opening a port |
| `src/config/env.ts` | Reads and validates env vars with zod once at startup. The only file that touches `process.env` |
| `src/lib/db.ts` | The single Prisma client (one connection pool) |
| `src/lib/jwt.ts` | Signs and verifies the session token |
| `src/lib/http-error.ts` | `HttpError(status, message)`: thrown by services, turned into a response by the error handler |
| `src/middleware/require-auth.ts` | Reads the cookie, verifies the token, sets `req.userId`, or returns 401 |
| `src/middleware/validate.ts` | `validateBody(schema)`: parses and cleans `req.body` with zod, or returns 400 |
| `src/middleware/error-handler.ts` | The one place errors become `{ error, details? }` responses |
| `src/modules/auth/auth.routes.ts` | URL → middleware → controller wiring for `/api/auth/*` |
| `src/modules/auth/auth.controller.ts` | HTTP layer: calls the service, sets or clears the cookie, sends JSON |
| `src/modules/auth/auth.service.ts` | Business logic: hash and check passwords, create and load users. The only auth code that touches the DB |
| `src/modules/auth/auth.schemas.ts` | zod schemas for register/login input (email trimmed and lower-cased) |
| `src/modules/auth/auth.cookie.ts` | Cookie name and options (httpOnly, sameSite lax, secure in production) |
| `src/modules/auth/auth.test.ts` | API tests: register, duplicate email, validation, login, the same 401 for wrong email and wrong password, logout, forged token |
| `src/modules/preferences/preferences.catalog.ts` | The quiz choices: supported coins (CoinGecko ids), labels for investor and content types |
| `src/modules/preferences/preferences.schemas.ts` | zod schema for the answers: known coins only, at least one of each, duplicates removed |
| `src/modules/preferences/preferences.service.ts` | Read and upsert the user's Preferences row |
| `src/modules/preferences/preferences.controller.ts` / `.routes.ts` | `GET /options`, `GET /`, `PUT /`, all behind `requireAuth` |
| `src/modules/preferences/preferences.test.ts` | API tests: auth required, options, save completes onboarding, overwrite, validation |
| `src/lib/cache.ts` | `TtlCache`: cache-aside with a TTL; concurrent misses share one load; serves the stale value if a reload fails |
| `src/lib/http.ts` | `fetchJson` / `fetchText`: external HTTP calls with a timeout; throw on non-2xx |
| `src/providers/types.ts` | `Sourced<T>` = `{ source: 'live' \| 'fallback', data }` |
| `src/providers/prices.coingecko.ts` | One cached top-100 CoinGecko call feeds `getCoinMarkets` (the user's coins) and `getTopMovers`; sparkline thinned to 42 evenly spaced points that keep the first and last, so the series ends at the latest price |
| `src/providers/news.ts` | News orchestrator: tries CryptoPanic (if keyed) → RSS → `data/news.json`; tags and ranks stories by the user's coins |
| `src/providers/news.cryptopanic.ts` | CryptoPanic adapter: posts → `NewsItem` (needs a paid key) |
| `src/providers/news.rss.ts` | RSS adapter: the feed list (Cointelegraph, CoinDesk, Decrypt), XML parsing with `fast-xml-parser`, tracking parameters stripped |
| `src/providers/insight.openrouter.ts` | Builds the prompt, calls OpenRouter (with model fallbacks), or returns the rule-based fallback |
| `src/providers/memes.ts` | Reddit memes (NSFW filtered), random pick that skips downvoted ones; falls back to `data/memes.json` |
| `src/modules/dashboard/dashboard.service.ts` | One function per section: load preferences → call provider → attach `myVote`. Stores the daily insight |
| `src/modules/dashboard/dashboard.routes.ts` | The 4 section endpoints (handlers are one-liners, so there's no separate controller) |
| `src/modules/feedback/*` | Vote schema, upsert/delete with the preferences snapshot, routes and tests |
| `src/test/fake-apis.ts` | Replaces `fetch` with per-host fakes so tests never call real APIs |
| `src/test/*` | Test setup: migrate the test DB once, truncate tables between tests, a signed-in agent helper |

## Client (`client/`)

| File | What it does |
|---|---|
| `vite.config.ts` | Vite plugins (React, Tailwind), the `/api` proxy to the local server, the test environment |
| `src/main.tsx` | Mounts the app inside the React Query provider and the router |
| `src/App.tsx` | The route table. Guards wrap groups of routes |
| `src/routes/guards.tsx` | `RequireAuth` (guest → /login; no preferences → /onboarding) and `GuestOnly` |
| `src/api/client.ts` | `apiFetch`: the only place that calls `fetch`; throws `ApiError` with field errors |
| `src/api/auth.ts` | Typed functions for the auth endpoints |
| `src/hooks/useAuth.ts` | `useMe` (the cached current user), login/register/logout mutations that update that cache, and `signOutLocally` |
| `src/lib/queryClient.ts` | The React Query client: no retries on 401, and any 401 signs the user out (sends them to /login) |
| `src/lib/errors.ts` | Turns an API error into field messages plus a form message |
| `src/components/AuthLayout.tsx` | Shared card for the login and signup pages |
| `src/components/ui/Button.tsx`, `TextField.tsx` | Reusable UI building blocks |
| `src/api/preferences.ts` | Types and functions for the preferences endpoints |
| `src/hooks/usePreferences.ts` | `usePreferenceOptions`, `usePreferences`, and `useSavePreferences`, which also flips `hasPreferences` in the cached user so the guard lets them through |
| `src/pages/OnboardingPage.tsx` | The 3-step quiz, driven by a `STEPS` array; one PUT on the last step. When opened from "Edit preferences" it waits for the saved answers and starts from them, and Back on step 1 returns to the dashboard |
| `src/components/onboarding/ChoiceCard.tsx` | A selectable answer card (`aria-pressed` toggle button) |
| `src/components/onboarding/StepProgress.tsx` | "Step 2 of 3" and the progress bar |
| `src/lib/toggle.ts` | Add or remove a value from a list (used for the multi-select questions) |
| `src/api/dashboard.ts` | Types for the 4 sections, plus `sendVote` (PUT for a vote, DELETE to clear it) |
| `src/hooks/useDashboard.ts` | One query hook per section, each with its own refresh policy |
| `src/hooks/useToday.ts` | `useToday()`: the local date, updated by one timer at midnight; plus the user's time zone for the insight request (decision 38) |
| `src/hooks/useVote.ts` | Optimistic thumb state for one item, rolled back on error; `onSaved` lets the row react (collapse the story, load a new meme) |
| `src/components/dashboard/SectionCard.tsx` | Shared card shell: title, "Sample" badge, loading skeleton, error and retry. Takes the query and a render function |
| `src/components/dashboard/{Insight,Prices,News,Meme}Section.tsx` | The four sections; each renders its data inside a `SectionCard` |
| `src/components/dashboard/VoteButtons.tsx` | 👍/👎 plus a fading "Saved" hint; presentational, fed by `useVote` |
| `src/components/dashboard/Sparkline.tsx` | 7-day price line as one SVG polyline |
| `src/components/dashboard/PriceChart.tsx` | The expanded 7-day chart: hand-drawn SVG, hover/drag readout, 7d change/high/low; a keyboard slider for accessibility (decision 41) |
| `src/lib/chart.ts` | `chartStats` (low, high, change) and `pointTime` (when each sparkline point was recorded) |
| `src/lib/sectionOrder.ts` | Content preferences → order of the sections |
| `src/lib/format.ts` | Money, percent, "3 hours ago", clock time and the dashboard date |
| `src/pages/DashboardPage.tsx` | Header, plus the sections in preference order |
| `src/pages/*` | One component per screen |
