# AIMT College Management System

A complete, full-stack **College Management System** for **Ambalika Institute of
Management and Technology (AIMT), Lucknow, Uttar Pradesh, India**.

One common login page for every account type. The server reads the account's
real database role and redirects automatically — students to
`/student/dashboard`, management to `/management/dashboard`, administrators to
`/admin/dashboard`. There are no role-selection buttons and the browser is never
trusted for role information.

## Features

**Authentication & security**
- Single common login page (email + password, show/hide, forgot password)
- Public student registration — always creates a `STUDENT` account, never staff
- bcrypt password hashing (12 rounds), HTTP-only `SameSite=Lax` session cookies
- Database-backed sessions with server-side expiry (1 day, 30 with remember-me)
- Login rate limiting, CSRF origin checks, security headers
- Server-side RBAC on every page (`proxy.ts`) and every API route
- Database-backed **permission matrix** — admins can grant/revoke granular
  permissions per role at runtime (Roles & Permissions page)
- Last-admin safeguards (cannot deactivate/demote the last active admin,
  cannot change your own role)
- Password reset workflow (demo-mode links) and change-password with
  other-session invalidation
- Full audit log of administrative actions

**Student portal** — dashboard, profile, notices, tasks/assignments, personal
records, attendance, examinations, help & support, change password.

**Management portal** — dashboard, student records (search/filter + detail view
with record creation), reports & analytics (4 real report types), task &
support-request tools, notice publishing, academic information with attendance
marking and exam-result entry, settings.

**Admin portal** — system overview, user management, management-account
provisioning, roles & permissions matrix, system settings, audit logs, account
security (active sessions).

**Data** — PostgreSQL via Prisma: users, student profiles, sessions, notices,
notice reads, tasks, student records, reports, audit logs, password-reset
tokens, support requests, settings, permissions, attendance, exam results.

## Technology

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
lucide-react · Prisma 6 · PostgreSQL · bcryptjs · zod · vitest

## Project structure

```
aimt-cms/
  app/                  # Pages + API routes (App Router)
    (public)            # page, about, gallery, login, register,
                        # forgot-password, reset-password, unauthorized
    student/            # Student portal (9 pages)
    management/         # Management portal (8 pages)
    admin/              # Admin portal (8 pages)
    api/                # REST API routes
  components/           # Reusable UI components
  lib/                  # Auth, sessions, RBAC, permissions, validation…
  prisma/
    schema.prisma       # Database schema
    migrations/         # SQL migrations
    seed.ts             # Seed script (demo accounts + data)
  public/images/        # Real AIMT logo + campus photos (see image-sources.md)
  tests/                # Automated tests (vitest)
  proxy.ts              # Auth/role gating + CSRF for API routes
  .env.example          # Environment template (no secrets)
```

## Opening the project in VS Code

1. Extract `AIMT-College-Management-System.zip`.
2. Open VS Code → **File → Open Folder** → select the extracted
   `AIMT-College-Management-System` folder.
3. Open a terminal inside VS Code (`Ctrl+`` `) and follow the setup below.
   Recommended extensions: *Prisma*, *ESLint*, *Tailwind CSS IntelliSense*.

## Prerequisites

- **Node.js 20+** — download from https://nodejs.org (LTS). Check with
  `node --version`.
- **PostgreSQL 14+** — see database setup below.

## Database setup (PostgreSQL)

**Windows**
1. Download the installer from https://www.postgresql.org/download/windows/
   and run it. Remember the password you set for the `postgres` user.
2. Open **pgAdmin** (installed with PostgreSQL) or **SQL Shell (psql)**.
3. Create a database:
   ```sql
   CREATE DATABASE aimt_cms;
   ```

**macOS / Linux**
```bash
# Ubuntu/Debian
sudo apt install postgresql
sudo -u postgres psql -c "CREATE DATABASE aimt_cms;"
```

Your connection string will look like:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/aimt_cms
```

## Installation & first run (exact commands)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# then edit .env and set DATABASE_URL (and ADMIN_EMAIL / ADMIN_PASSWORD)

# 3. Create database tables
npx prisma migrate deploy

# 4. Seed the initial admin account, demo accounts and demo data
npm run db:seed

# 5. Start the development server
npm run dev
```

Open http://localhost:3000 in your browser.

**Production build**
```bash
npm run build
npm start
```

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `ADMIN_EMAIL` | Seed only | `admin@aimt.edu` | Initial admin login email |
| `ADMIN_PASSWORD` | Seed only | `ChangeMe123!` | Initial admin password (**change immediately**) |
| `DEMO_MANAGER_EMAIL` | Seed only | `manager@aimt.edu` | Demo management account |
| `DEMO_STUDENT_EMAIL` | Seed only | `student@aimt.edu` | Demo student account |
| `ALLOW_DEMO_RESET_LINKS` | No | `false` | When `true`, forgot-password returns the reset URL in the API response (demo only — wire an email provider for production) |
| `NODE_ENV` | No | `development` | Set to `production` on deploy (enables Secure cookies) |

Never commit a real `.env` file. Copy `.env.example` instead.

## Creating the first admin account (securely)

The seed script provisions the first admin:

```bash
ADMIN_EMAIL=you@college.edu ADMIN_PASSWORD='<strong-secret>' npm run db:seed
```

- The password is hashed with bcrypt before storage; it is never stored or
  logged in plain text.
- Change the seeded password after first login (Profile → Change Password),
  or set a fresh one via forgot-password.
- Management accounts are created by an admin from **Admin → Management
  Accounts** (never via public registration).
- Students self-register at **/register** — registration always creates a
  `STUDENT` account; the role cannot be chosen.

### Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aimt.edu` | `ChangeMe123!` |
| Management | `manager@aimt.edu` | `Manager123!` |
| Student | `student@aimt.edu` | `Student123!` |

⚠️ **Change these immediately on any shared or public deployment.** Seeded
notices, tasks, records, attendance and exam rows are clearly-labelled demo
data — delete or replace them before real use.

## Image assets

Real, verified AIMT branding lives in `public/images/`:

- `aimt-logo.png` — official AIMT crest (from the college website header)
- `aimt-campus-main.jpg` — aerial view of the main academic block
- `aimt-campus-reception.jpg`, `aimt-campus-hostel.jpg`,
  `aimt-campus-library.jpg`, `aimt-campus-computer-lab.jpg`,
  `aimt-campus-classroom.jpg`, `aimt-campus-cnc-lab.jpg`,
  `aimt-campus-robotics-lab.jpg`, `aimt-campus-canteen.jpg`

`public/images/image-sources.md` records the source page of every image.
All photos were downloaded from the official college website
(https://aimt.edu.in/) and visually verified. If you obtain a campus-entrance
photo, save it as `public/images/aimt-campus-entrance.jpg` — the About and
Gallery pages will pick it up automatically. Components fall back to a branded
placeholder if a file is missing, so the site never shows broken images.

## Testing

```bash
npm run typecheck   # TypeScript — must be clean
npm test            # vitest — 63 unit tests
```

- `tests/integration.test.ts` (3 tests) runs only when `DATABASE_URL` points
  to a reachable database; otherwise it skips with a clear message.
- Login/registration flows, role redirects, protected pages/APIs, wrong-role
  denial, privilege-escalation guards and session expiry are covered by the
  unit tests plus the documented manual checklist in `proxy.ts` and the API
  routes.

## Deployment (Vercel + hosted Postgres)

1. Create a free Postgres database (e.g. **Neon** — https://neon.tech) and
   copy the connection string.
2. Push this project to a Git repository and **Import** it in Vercel.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `DATABASE_URL` = your Neon connection string
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` = your first admin credentials
4. Deploy. Then run migrations + seed **once** against the hosted DB:
   ```bash
   DATABASE_URL='<neon-string>' npx prisma migrate deploy
   DATABASE_URL='<neon-string>' ADMIN_EMAIL='you@college.edu' \
     ADMIN_PASSWORD='<strong-secret>' npm run db:seed
   ```
5. Change the seeded passwords after first login.

## Security notes

- Passwords: bcrypt, 12 rounds. Hashes never leave the server.
- Sessions: 256-bit opaque tokens, SHA-256 hashed at rest, HTTP-only,
  `SameSite=Lax`, `Secure` in production, absolute server-side expiry.
- Every API route re-verifies authentication, role **and** permission;
  `proxy.ts` gates every dashboard page.
- Login/register are rate-limited per IP; state-changing APIs check Origin.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  strict `Referrer-Policy`, restrictive `Permissions-Policy`.

## Known limitations (honest)

- **Email is not wired**: password-reset links are returned in the API
  response only when `ALLOW_DEMO_RESET_LINKS=true`. Connect an email provider
  (e.g. Resend, SendGrid) in `app/api/auth/forgot-password/route.ts` for
  production.
- **Rate limiter is in-memory**: correct for a single server instance; use
  Redis/Upstash for multi-instance deployments.
- **No entrance-gate photo**: the official site publishes none; supply
  `public/images/aimt-campus-entrance.jpg` to fill that slot.
- **Logo resolution**: the official site serves the crest at 104×104 — best
  available official quality; keep it at header/favicon sizes.
- About-page copy is intentionally generic: no accreditations, rankings or
  placement statistics are claimed.
- Integration/E2E tests need a live database/browser and are skipped in
  offline environments.
