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
| `src/hooks/useAuth.ts` | `useMe` (the cached current user), plus login/register/logout mutations that update that cache |
| `src/lib/errors.ts` | Turns an API error into field messages plus a form message |
| `src/components/AuthLayout.tsx` | Shared card for the login and signup pages |
| `src/components/ui/Button.tsx`, `TextField.tsx` | Reusable UI building blocks |
| `src/api/preferences.ts` | Types and functions for the preferences endpoints |
| `src/hooks/usePreferences.ts` | `usePreferenceOptions`, `usePreferences`, and `useSavePreferences`, which also flips `hasPreferences` in the cached user so the guard lets them through |
| `src/pages/OnboardingPage.tsx` | The 3-step quiz, driven by a `STEPS` array; one PUT on the last step |
| `src/components/onboarding/ChoiceCard.tsx` | A selectable answer card (`aria-pressed` toggle button) |
| `src/components/onboarding/StepProgress.tsx` | "Step 2 of 3" and the progress bar |
| `src/lib/toggle.ts` | Add or remove a value from a list (used for the multi-select questions) |
| `src/pages/*` | One component per screen |
