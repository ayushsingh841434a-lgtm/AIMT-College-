# AIMT College member portal

This Vite site uses Supabase Auth for real member accounts and a Postgres `profiles` table for roles and approval status. New members can request Student or Management access. An approved Admin reviews the requests and chooses the assigned role. Pending and rejected members cannot open a dashboard. Dashboard statistics are sample content; registration, sign-in and approval use Supabase.

## Set up Supabase

1. Create a Supabase project. In its **SQL Editor**, run [supabase/schema.sql](supabase/schema.sql). This creates the profile table, sign-up trigger, and access rules.
2. In **Authentication → Providers**, enable Email. Keep email confirmation enabled so members prove they control their address.
3. In **Project Settings → API Keys**, copy the Project URL and the **publishable key** (or legacy `anon` key). Never use a service-role or secret key in the site.
4. In **Authentication → URL Configuration**, set **Site URL** to `https://aimt-college.vercel.app/`. Add that exact address to **Redirect URLs**. Add `http://localhost:5173/**` for local development. Add a Render URL only if you also deploy this version there.

The first Admin must be created by the project owner in the SQL Editor. Register `admin@aimt.edu` through the site's **Request access** form and confirm the email. That inbox must be accessible to you. Then run this SQL:

```sql
update public.profiles
set role = 'admin', status = 'approved', reviewed_at = now()
where id = (select id from auth.users where email = 'admin@aimt.edu');
```

Check that the SQL Editor reports **1 row affected**. Sign out and sign back in; your Admin dashboard will display pending requests. This bootstrap SQL runs only in your Supabase project; it is not part of the public website.

## Local development

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
```

The supplied Supabase Project URL and publishable key are already in `src/supabase-config.js`. You can optionally copy `.env.example` to `.env.local` to override them for another project. Run:

```sh
npm run dev
```

Open the URL printed by Vite. Live Server cannot inject Vite environment variables or resolve the installed Supabase package; use `npm run dev` for this version.

## Deploy the already connected project

Complete the Supabase SQL setup before pushing this version to an auto-deploy branch. The Project URL and publishable key are already configured in source. The publishable key is safe to ship in browser code because database access is enforced by Row Level Security.

If you later switch Supabase projects, set these two environment variables in Vercel under **Settings → Environment Variables** (or in Render), or edit `src/supabase-config.js`:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key or legacy anon key |

Vercel reads `vercel.json`, runs `npm run build`, and publishes `dist`. Redeploy after changing environment variables because Vite includes their values in the built JavaScript.

For an existing Render **Web Service**, use Build Command `npm ci && npm run build` and Start Command `npm start`. For a Render **Static Site**, use Build Command `npm ci && npm run build` and Publish Directory `dist`. Set the optional override variables there if you change projects.

If the Vercel and Render projects still point to the old GitHub repository, connect them to `ayushsingh841434a-lgtm/AIMT-College-` or import that repository as a new project. A Git push to another repository will not update an existing site that is still connected to the old one.

## Access model

- Supabase Auth stores passwords; the browser code contains no shared demo password.
- A database trigger creates new profiles as `pending` and only accepts Student or Management requests. A user cannot request Admin access.
- Row Level Security lets members read only their own profile. Approved Admins can read and review the queue. Only Admins can update the `role`, `status`, and `reviewed_at` fields.
- The dashboard figures are placeholders and should be replaced with real college data before relying on them.
