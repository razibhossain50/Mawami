# Project Overview

**Mawami** (repo name: `Finder`) is a matrimony / biodata platform. Users create a multi-step biodata (marriage profile), browse and search other approved biodatas, save favorites, and share profiles. Admins review and approve biodatas and manage users.

Production domain: `https://mawami.com`

## Architecture at a Glance

```
Browser
  │
  ├── Next.js frontend (Vercel)  ── frontend/
  │       │  REST + JWT Bearer (NEXT_PUBLIC_API_BASE_URL)
  │       ▼
  └── NestJS API (Railway)       ── backend/   → all routes under /api, Swagger at /api/docs
          │
          ├── PostgreSQL (Railway) via TypeORM
          └── Cloudflare R2 (S3-compatible) for profile pictures
```

- **Monorepo** with npm workspaces (`frontend`, `backend`). Node `>=20.8.1`.
- In development, Next.js rewrites `/api/*` to `http://localhost:${BE_PORT:-3001}/api/*`.

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Frontend | Next.js 15.2 (App Router), React 19, TypeScript, HeroUI 2.8, Tailwind CSS 4, TanStack React Query 5, React Hook Form + Zod, Framer Motion, react-image-crop |
| Backend  | NestJS 11, TypeORM 0.3 + PostgreSQL (`pg`), Passport (JWT + Google OAuth 2.0), bcrypt, class-validator, Multer, `@aws-sdk/client-s3` (R2), Swagger |
| Testing  | Frontend: Jest + Testing Library, Playwright (E2E). Backend: Jest, plus a node API script |
| Deploy   | Frontend → Vercel (`vercel.json`). Backend + DB → Railway (`railway.toml`, nixpacks, Node 20). See `DEPLOYMENT.md` |

## Domain Model

| Entity | Notes |
|--------|-------|
| `User` (`backend/src/user/user.entity.ts`) | Email (unique), password hash, role: `user` \| `admin` \| `superadmin` |
| `Biodata` (`backend/src/biodata/biodata.entity.ts`) | One per user (`userId`). Tracks form `step`, personal / education / family / partner-preference / contact fields, profile picture URL, approval + visibility status |
| `Favorite` (`backend/src/favorites/favorites.entity.ts`) | User ↔ Biodata bookmark |
| `ProfileView` (`backend/src/biodata/entities/profile-view.entity.ts`) | View tracking; a viewer (user/IP) counts once per 24 hours |

### Biodata status (two layers)
- **Admin approval** (`BiodataApprovalStatus`): `in_progress` → `pending` → `approved` / `rejected` / `inactive`
- **User visibility** (`BiodataVisibilityStatus`): `active` / `inactive`. Users can toggle this only once approved.
- A biodata is publicly visible only when it is **approved** and **active**.

## Backend (`backend/src/`)

Feature modules: `auth`, `user`, `biodata`, `favorites`, `upload`, plus `common/filters` (global `HttpExceptionFilter`).

Key endpoints (all prefixed with `/api`):

| Module | Routes |
|--------|--------|
| `auth` | `POST signup`, `POST login`, `POST admin/login`, `POST logout`, `GET google`, `GET google/callback` |
| `users` | CRUD, `PUT :id/password` (admin-guarded via `RolesGuard`) |
| `biodatas` | `GET search`, `GET/PUT current`, `PUT current/toggle-visibility`, `PUT :id/step/:step`, `GET admin/all`, `PUT :id/approval-status`, `POST :id/view`, `GET :id/view-count`, `GET current/view-stats`, standard CRUD |
| `favorites` | `POST/DELETE :biodataId`, `GET`, `GET check/:biodataId`, `GET count` |
| `upload` | `POST profile-picture` (Multer → R2 under `profile-pictures/`) |

Bootstrap notes (`backend/src/main.ts`):
- Global `ValidationPipe` (`whitelist: true`, `transform: true`).
- A superadmin is auto-created on startup (`AuthService.createSuperAdmin`).
- Port: `BE_PORT` or `PORT`, defaulting to `3001`.

### Database
- `synchronize: false`. The schema is managed by hand-written migrations in `src/migrations/` (`enums`, `user`, `biodata`, `favorites`, `profile_views`), run through `src/database-migration.ts`.
- Seed data lives in `src/seeds/` and is run through `src/database-seed.ts`.
- DB connection env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` (local default DB name: `finder`).

## Frontend (`frontend/src/`)

| Path | Purpose |
|------|---------|
| `app/(client)/` | Public site: home, biodata search/listing (`profile/biodatas`), public profile (`profile/biodatas/[id]` with OG/Facebook metadata), auth (login, signup, Google callback), legal pages |
| `app/(client)/(protected)/` | Logged-in user pages: `dashboard`, `favorites`, `profile/biodatas/edit/[id]`, `settings` |
| `app/admin/` | Admin panel: dashboard, `biodatas`, `users`, `settings` |
| `app/auth/admin/login` | Admin login |
| `components/profile/marriage/` | Multi-step biodata form (personal → educational → family → partner preferences → contact) |
| `services/` | `api-client.ts` (fetch wrapper, auth headers, timeouts), `api-services.ts`, React Query config, Zod validation, error handling, logger |
| `context/` | Auth (regular + admin), theme, sidebar, toast providers |
| `hooks/` | `use-step-form`, `useFavorites`, `useProfileView`, `useBiodataStatus`, `useImageCrop` |

Auth on the frontend:
- Separate tokens for regular users and admins: `regular_user_access_token` and `admin_user_access_token` in `localStorage`.
- `middleware.ts` guards `/admin/*` using the `admin_user_access_token` cookie and redirects to `/auth/admin/login`.
- `ProtectedRoute` / `AdminGuard` components guard pages on the client side.

## Common Commands (from the repo root)

```bash
npm run dev            # frontend (3000) + backend (3001)
npm run build          # build both
npm run test           # Jest for both workspaces

npm --workspace backend run database:migration-seed   # create schema + seed
npm --workspace frontend run test:e2e                 # Playwright
npm --workspace frontend run typecheck
```

## Environment Variables

- **Frontend:** `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_TIMEOUT`, `NEXT_PUBLIC_R2_BASE_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ENVIRONMENT`
- **Backend:** `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, `RECAPTCHA_SECRET_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`

## Things to Know

- **CORS is currently wide open** (`origin: true`, plus manual headers that reflect the request origin). The allowlist in `main.ts` is defined but not used.
- `forbidNonWhitelisted` is `false` for now, so unknown DTO properties are stripped instead of rejected.
- Profile pictures are stored in R2. `frontend/public/uploads/` holds only legacy local uploads.
- Related context docs: `context/product.md`, `context/tech.md`, `context/structure.md`, `backend/CONTEXT.md`, `frontend/context.md`. Some of these are outdated. For example, they mention `lib/` (now `services/`), `data-source.ts`, and AWS S3 (now Cloudflare R2). Trust the code over those docs.
