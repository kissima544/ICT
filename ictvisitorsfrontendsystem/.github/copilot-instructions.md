## Repository Overview

- **Purpose**: Frontend Next.js app (`ictvisitorsfrontendsystem`) and backend ASP.NET Core API (`ICTVisitorsManagementSystem`) for an ICT visitor management system.
- **Frontend framework**: Next.js 16 (App Router) — app directory present (`/app`). Key UI components live under `components/` and `components/ui/`.
- **Backend framework**: ASP.NET Core Web API in `ICTVisitorsManagementSystem/ICTVisitorsManagementSystem` using JWT, Google auth, and email OTP flows.

## How To Run (dev)

- **Frontend**: from `ictvisitorsfrontendsystem` run:

  - `npm install` then `npm run dev` (uses `next dev`). See `package.json` scripts.

- **Backend**: open `ICTVisitorsManagementSystem/ICTVisitorsManagementSystem` and run with the .NET SDK:

  - `dotnet run` (or open `ICTVisitorsManagementSystem.sln` in Visual Studio and run)

Notes: the frontend's `js/auth.js` points at `https://localhost:7099/api` by default — this is the primary integration URL used in the repo.

## Architecture & Data Flow (concise)

- **Frontend (Next.js App Router)**: UI pages live under `app/` (`/app/page.tsx`, `/app/dashboard/page.tsx`, `/app/login/page.tsx`, `/app/register/page.tsx`). `app/layout.tsx` configures site metadata and global providers (analytics, toasts).
- **Shared UI system**: `components/ui/` contains small primitives (buttons, inputs, table, dialogs) used across pages — follow existing component patterns when adding new UI.
- **Backend API**: controllers under `ICTVisitorsManagementSystem/Controllers` (example: `AuthController.cs`) expose endpoints like `/api/auth/*`. `Program.cs` wires JWT, Google auth, Swagger, CORS (dev: AllowAll), EF Core DbContext.
- **Authentication flow**: frontend sends Google id tokens / email logins to the backend which handles OTP/email verification. Backend returns JWTs stored in `localStorage` by the frontend (see `js/auth.js`).

## Important Files & Conventions

- **Frontend**:
  - `package.json` — dev/build/start scripts. Use `npm run dev` to start local dev server.
  - `next.config.mjs` — `typescript.ignoreBuildErrors = true` and `images.unoptimized = true` (be careful: TypeScript errors are ignored at build here).
  - `app/layout.tsx` — global providers (Toaster, Analytics).
  - `components/` and `components/ui/` — reusable components; follow established props and cx/class patterns.
  - `js/auth.js` — legacy JS auth helpers; contains hard-coded `API_BASE_URL` (dev default `https://localhost:7099/api`). Update only when you know backend URL.

- **Backend**:
  - `Program.cs` — app wiring (DbContext, JWT, Google auth, Swagger). CORS policy `AllowAll` is applied for dev.
  - `appsettings.json` — connection strings, JWT key, Google client id/secret, SMTP settings. These are committed in this repo for development; treat as secrets when moving to production.
  - `Controllers/AuthController.cs` — shows register/login/google login/otp/reset flows; use it as canonical source for API contract.

## Integration Points & Environment

- **Frontend → Backend**: frontend calls backend at `https://localhost:7099/api` (see `js/auth.js`). Search for other hard-coded API URLs before changing base URL.
- **Environment variables**: the frontend reads runtime config from environment variables if present:
  - `NEXT_PUBLIC_API_BASE_URL` — base URL for backend API (defaults to `https://localhost:7099/api`).
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client id used by the frontend (falls back to the committed client id).

- **Frontend → Backend**: frontend calls backend at `https://localhost:7099/api` (see `js/auth.js` and `app/login/page.tsx`). Search for other hard-coded API URLs before changing base URL.
- **Database**: backend uses SQL Server (connection string in `appsettings.json`). For development the connection points to a local SQL Express instance.
- **Secrets**: `appsettings.json` contains JWT key, Google and SMTP credentials. Do not accidentally publish or rotate these without updating local envs. Prefer environment variables for CI/production.

## Developer Guidance for AI Agents

- **When editing API-related code**: consult `AuthController.cs` and `Program.cs` first — they define endpoints, auth schemes, and expected payloads.
- **For UI changes**: reuse existing `components/ui/*` patterns (props naming, `className` + `cx` usage). Check `app/layout.tsx` for global providers.
- **Build & type safety**: `next.config.mjs` currently ignores TypeScript build errors; do not assume type-safety is enforced by CI locally.
- **Tests**: there are no automated test scripts in `package.json`; assume manual testing. Run both frontend (`npm run dev`) and backend (`dotnet run`) and exercise auth flows.
- **Sensitive files**: `appsettings.json` contains dev secrets — avoid committing further secrets. If you need to update secrets, replace with environment variables and document the change.

## Quick Search Patterns (useful when working as an agent)

- Find frontend entry points: `app/page.tsx`, `app/layout.tsx`, `app/dashboard/page.tsx`.
- Find backend API and auth: `Controllers/AuthController.cs`, `Program.cs`, `appsettings.json`.
- Find hard-coded API URL: search for `https://localhost:7099` or `API_BASE_URL` (in `js/auth.js`).

## Do / Don't

- **Do**: preserve the frontend App Router structure, reuse `components/ui/*` primitives, and follow the JWT + OTP contract defined in `AuthController.cs`.
- **Don't**: change `appsettings.json` secrets blindly, remove CORS without verifying frontend access, or assume TypeScript build fails will stop deployment (config currently ignores build errors).

## Google OAuth setup (quick steps)

- 1) In Google Cloud Console, create OAuth 2.0 Client ID (Web application).
  - Authorized JavaScript origins: `http://localhost:3000` (or your dev host/port).
  - Authorized redirect URIs: you do not need a redirect for the Google Identity Services one-tap flow, but if you use OAuth redirect flows add your app URL.

- 2) Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the frontend `.env.local` at the repo root (`ictvisitorsfrontendsystem/.env.local`):

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=https://localhost:7099/api
```

- 3) Configure backend `appsettings.json` (or better: use environment variables in production):
  - `Authentication:Google:ClientId` and `ClientSecret` must match the Cloud Console credentials.
  - Ensure `CallbackPath` in `Program.cs` (`/api/externalauth/google-callback`) is allowed if you use redirect flows.

- 4) Run both services locally:

```powershell
cd \path\to\ICTVisitorsManagementSystem\ICTVisitorsManagementSystem
dotnet run

cd \path\to\ictvisitorsfrontendsystem
npm install
npm run dev
```

- 5) Test the flow: open the frontend login page, click "Continue with Google", complete the Google sign-in. If the backend sends OTP, use the modal to verify. On success, a JWT is stored in `localStorage` under `token`.

If you want, I can add a small `.env.example` and update `js/auth.js` to read `NEXT_PUBLIC_API_BASE_URL` as well.

---

If any of these integration details are out-of-date or you want a longer-form developer guide (runbooks, CI, or secret rotation), tell me which area to expand and I'll update this file.
