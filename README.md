# AIMT College portal demo

A small, single-page demo with three profiles: Student, Management, and Admin. Each opens a separate sample dashboard. All data is fictional. Sign-in checks public credentials in the browser and keeps the selected profile in the current browser tab. **This is not suitable for real accounts or private college data.**

## Demo accounts

| Profile | Email | User ID | Password |
| --- | --- | --- | --- |
| Student | `student@aimt.edu` | `AIMT2024001` | `Student123!` |
| Management | `manager@aimt.edu` | `MGT001` | `Manager123!` |
| Admin | `admin@aimt.edu` | `ADMIN001` | `ChangeMe123!` |

Enter your email/user ID and password. Your account automatically determines whether the Student, Management or Admin dashboard opens.

## Run locally

You can also right-click `index.html` in VS Code and choose **Open with Live Server**. The source files work directly over HTTP without a build. Enter your credentials, then click **Sign in**.

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. To check the production build:

```sh
npm test
npm run build
npm start
```

`npm start` serves the built `dist` directory on `PORT` (default 3000).

## Deploy

Push this folder to the existing GitHub repository. The `.git` directory was retained so its remote stays connected. The old live URLs will change only after their hosts deploy the new commit.

**Vercel:** The included `vercel.json` selects Vite, runs `npm run build`, and publishes `dist`. Set the project root to this repository root.

**Render existing Node web service:** Set the build command to `npm ci && npm run build` and start command to `npm start`. The included server binds to Render's `PORT` on `0.0.0.0`, so the existing service URL can continue to work. No database or environment variables are required.

**Render new Static Site (optional):** Use build command `npm ci && npm run build` and publish directory `dist`; no start command is needed.
