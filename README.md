# GRAVITAS AI

**Intelligent Conversations. One Project at a Time.** · Group No. 27

GRAVITAS AI is a real-time chat website that **simulates an AI assistant**. A user chats with "Gravitas AI"; the replies are written by a human **AI operator** who signs in separately to the **Operator Console**. No external AI API is used. The interface says so to users: replies come from a human operator, not an autonomous model.

The demo project shown throughout the app is **Project AETHER-218** (`GRV-2.18`, *Predictive Systems Research and Development*, status *In Progress*).

---

## 1. Features

- **Two separate sign-in pages**: `/login/user` for users and `/login/ai` for operators, plus public registration at `/register` (users only).
- **Secure operator role**: choosing a login page grants nothing. The role is stored in the database, can only be assigned by a trusted setup step (SQL editor or the dev seed script), and the backend checks it on every request.
- **WhatsApp-style chat**: your own messages show on the right and the other side on the left, in both directions. The operator sees the same conversation mirrored. Includes date separators (Today / Yesterday / 28 October 2026), timestamps, and sending / sent / failed states with retry.
- **Images**: attach JPEG, JPG, PNG or WEBP (max 5 MB), preview before sending, add a caption, and watch upload progress. Files are stored in a **private** Supabase Storage bucket and viewed through short-lived signed URLs.
- **Real-time**: Supabase Realtime delivers messages, keeps the operator inbox up to date, and shows online presence and a typing indicator. It recovers after reconnecting and catches up on anything it missed.
- **Operator inbox**: search, avatars, latest-message previews, times, unread counts and online dots. On mobile, the chat opens full screen with a Back button.
- **Persistent history** in PostgreSQL, loaded page by page as you scroll up.
- **Responsive**: a sidebar layout on desktop, and on mobile a compact header with bottom navigation (Home, Projects, Chat, Profile).

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, JavaScript, Tailwind CSS 4, Lucide React, React Router 7 |
| Backend | Node.js, Express 5, Zod 4, Multer, Helmet, CORS, express-rate-limit |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (email + password) |
| Real-time | Supabase Realtime (Postgres changes + private presence/broadcast channels) |
| Files | Supabase Storage (private bucket, signed URLs) |

## 3. Folder structure

```
GravitasAI/
├── client/                     React app (Vite)
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/         auth, brand, chat, common, navigation, operator, profile
│   │   ├── config/app.js       branding / project / upload settings (reads shared config)
│   │   ├── context/            AuthProvider, ToastProvider, contexts
│   │   ├── hooks/              useAuth, useConversationMessages, useInbox, useRealtimeRooms,
│   │   │                       useReadStatus, useImageAttachment, useSignedImage, useOnlineStatus
│   │   ├── layouts/            AppLayout (user area), AuthLayout
│   │   ├── lib/supabaseClient.js
│   │   ├── pages/              Landing, logins, register, Home, Chat, Projects, Profile, OperatorDashboard
│   │   ├── services/           api.js, chatApi.js, messageStore.js, roomManager.js
│   │   ├── utils/              dates, message alignment/merging, files, validation
│   │   ├── App.jsx  main.jsx  index.css
│   ├── test/                   unit tests (node:test)
│   └── .env.example
├── server/                     Express API
│   ├── src/
│   │   ├── config/             env validation, Supabase admin client, project config
│   │   ├── controllers/        auth, conversation, message, upload
│   │   ├── middleware/         authenticate, authorize, rateLimit, upload, errorHandler
│   │   ├── routes/             auth, conversations, messages, uploads, health
│   │   ├── services/           profiles, conversations, messages, storage
│   │   ├── validators/         Zod schemas
│   │   ├── app.js  server.js
│   ├── test/                   API + unit tests (node:test + supertest)
│   └── .env.example
├── shared/gravitas.config.json  app name, Group No. 27, project details, welcome text, upload limit
├── supabase/
│   ├── migrations/             001 schema · 002 RLS · 003 storage + realtime
│   └── seed.sql                admin snippets (assign / revoke operator role)
├── scripts/
│   ├── seedDemo.mjs            dev-only: creates a test user + operator
│   └── checkBundle.mjs         checks the client build contains no server secrets
├── eslint.config.js  package.json  README.md
```

To change the group number, project name, code, description, status or welcome message, edit **`shared/gravitas.config.json`**. Both the client and the server read it. Existing conversations keep the project details they were created with.

## 4. Prerequisites

- **Node.js 20.12 or newer** (tested with Node 24). Check with `node -v`.
- A free **Supabase** account: <https://supabase.com>
- **VS Code** (recommended) and Windows PowerShell.

## 5. Install dependencies

Open PowerShell in the project folder (for example `D:\GravitasAI`) and run:

```bash
npm install
```

This installs the root, `client` and `server` packages, because the project uses npm workspaces.

## 6. Create a Supabase project

1. Sign in at <https://supabase.com/dashboard> and click **New project**.
2. Choose a name (for example `gravitas-ai`), set a database password (keep it somewhere safe) and pick a nearby region.
3. Wait until the project has finished provisioning.

## 7. Get your Supabase credentials

In the Supabase dashboard, open **Project Settings**:

| Value | Where to find it | Used by |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | Project Settings → **Data API** (or **API**) | client + server |
| **Publishable key** (`sb_publishable_…`) or legacy **anon** key | Project Settings → **API Keys** | client only |
| **Secret key** (`sb_secret_…`) or legacy **service_role** key | Project Settings → **API Keys** | server only |

> ⚠️ The secret / service_role key bypasses all database security. Put it **only** in `server/.env`. Never put it in `client/.env` or in any `VITE_` variable, and never share it.

## 8. Configure environment variables

```bash
Copy-Item server\.env.example server\.env
```

```bash
Copy-Item client\.env.example client\.env
```

Edit **`server/.env`**:

```
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your secret / service_role key>
```

Edit **`client/.env`**:

```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable / anon key>
VITE_API_BASE_URL=http://localhost:5000/api
```

Both `.env` files are git-ignored. Optional server settings: `STORAGE_BUCKET`, `MAX_UPLOAD_MB` (default 5), `SIGNED_URL_TTL_SECONDS` (default 3600) and `TRUST_PROXY`. If a required value is missing, the API refuses to start and tells you which one. The website shows a configuration screen instead of crashing.

## 9. Run the SQL migrations

In the Supabase dashboard, open **SQL Editor** → **New query**. Paste each file below, **in order**, and click **Run**:

1. `supabase/migrations/20261029000001_core_schema.sql` creates the tables, constraints, indexes and triggers, plus the trusted functions.
2. `supabase/migrations/20261029000002_row_level_security.sql` turns on Row Level Security and adds the read policies.
3. `supabase/migrations/20261029000003_storage_and_realtime.sql` creates the private `chat-attachments` bucket and its policies, the Realtime publication, and the private-channel authorization.

All three files are idempotent, so running one again is safe.

**What gets created**

| Table | Purpose |
|---|---|
| `profiles` | One row per Auth user: `display_name`, `avatar_path`, `role` (`user` / `ai_operator`), timestamps |
| `conversations` | A user's chat about one project: project name/code/description/status and a last-message summary. Unique per `(user_id, project_code)` |
| `messages` | `sender_id`, `sender_role`, `content`, `message_type`, `attachment_path/mime/size`, `client_id` (unique per conversation, which makes retries safe), timestamps |
| `conversation_reads` | Each account's last-read time per conversation, used for unread counts |

**Recommended Auth settings for local development** (Authentication → Sign In / Providers → Email):
- Turn **"Confirm email" off** if you want new users signed in immediately after registering. If it stays on, users must click the emailed link first; the app handles both.
- In Authentication → **URL Configuration**, set **Site URL** to `http://localhost:5173`.

## 10. Create the test user and the AI operator

### Option A: Supabase dashboard (manual)

1. **Test user**: open `http://localhost:5173/register` once the app is running (step 12) and register. Alternatively, go to Authentication → Users → **Add user** → *Create new user* and tick **Auto Confirm User**.
2. **Operator account**: in Authentication → Users → **Add user**, create an account for the operator (with Auto Confirm). Every new account starts as a normal `user`.
3. **Assign the operator role** (step 11).

### Option B: development seed script

Add these to `server/.env`, choosing your own passwords (at least 8 characters, not real passwords):

```
SEED_USER_EMAIL=student.user@example.com
SEED_USER_PASSWORD=choose-a-test-password-1
SEED_USER_NAME=Demo User
SEED_OPERATOR_EMAIL=gravitas.operator@example.com
SEED_OPERATOR_PASSWORD=choose-another-password-2
SEED_OPERATOR_NAME=Gravitas Operator
```

Then run:

```bash
npm run seed:demo
```

The script only creates accounts that don't exist yet, and it never changes an existing password. It promotes the operator **only if the script created that account in this run**. If the operator email already belongs to an ordinary user, the script stops and tells you. To deliberately promote that existing account, run `npm run seed:demo -- --promote-existing`. The script refuses to run when `NODE_ENV=production`.

## 11. Assign the operator role securely

Run this in the Supabase **SQL Editor**, using the operator account's email:

```sql
select * from public.assign_operator_role('gravitas.operator@example.com');
```

Why this is secure:
- New sign-ups always get `role = 'user'`. The database trigger ignores any role sent in sign-up metadata.
- Browsers cannot write to `profiles` at all, and a trigger blocks any role change unless it comes from the SQL editor (`postgres`) or the backend service role.
- `assign_operator_role` cannot be executed by the `anon` or `authenticated` roles, or even by the API's service role.
- The backend reads the role from the database after verifying the user's JWT. A role sent by the browser is never trusted.

To demote an operator later, run `select * from public.revoke_operator_role('email');`. More snippets are in `supabase/seed.sql`.

## 12. Start the app

```bash
npm run dev
```

This starts both servers:
- API at <http://localhost:5000/api> (health check: <http://localhost:5000/api/health>)
- Website at <http://localhost:5173>

| Command | What it does |
|---|---|
| `npm run dev` | API (auto-restarts on change) and website together |
| `npm run dev:server` / `npm run dev:client` | Only one of them |
| `npm run dev:lan` | Like `dev`, but the website is also reachable from other devices on your network |
| `npm run build` | Production build of the website into `client/dist` |
| `npm run preview` | Serves the production build on <http://localhost:4173> (proxies `/api` to port 5000) |
| `npm start` | Runs the API without auto-restart |
| `npm run lint` | ESLint for client, server and scripts |
| `npm test` | Server tests (API authorization, validation, uploads, CORS) and client tests (alignment, merging, dates) |
| `npm run verify:bundle` | Checks that `client/dist` contains no service-role/secret key (run after `build`) |
| `npm run check` | lint + test + build + verify:bundle |
| `npm run seed:demo` | Development-only demo accounts (step 10, option B) |

**Testing on your phone (same Wi-Fi):** set `VITE_API_BASE_URL=/api` in `client/.env`, run `npm run dev:lan`, then open the "Network" URL that Vite prints on your phone. Requests to `/api` are proxied to the API. Windows may ask you to allow Node.js through the firewall.

## 13. Test messaging with two separate sessions

Each sign-in is stored per browser profile, so use **two separate browser sessions**:

1. **Window 1** (normal window): open <http://localhost:5173>, click **Continue as User** and sign in as the test user. You land on `/chat`, where the welcome message from Gravitas AI appears on the left.
2. **Window 2** (an **InPrivate/Incognito** window, or a different browser): open <http://localhost:5173/login/ai> and sign in as the operator. You land on `/ai/dashboard`.
3. In window 1, send "Hello, I need help with my project." It appears on the **right** with a ✓ once the server has saved it.
4. In window 2, without refreshing, the conversation jumps to the top of the inbox with an unread badge. Open it: the user's message is on the **left**.
5. Reply in window 2. Your reply appears on the **right**, labelled "Gravitas AI (you)". In window 1 it appears on the **left** as **Gravitas AI**, with no refresh needed.
6. Start typing in one window to see the typing indicator in the other. The header shows Online/Offline presence.
7. Refresh either window: the session is restored and the history reloads in the correct order.

Things worth trying: register a second user in a third session to confirm the operator sees two separate conversations. While signed in as a user, open `/ai/dashboard` and you'll be sent back to `/chat`; an operator who opens `/chat` is sent to the dashboard.

## 14. Send images

1. Click the **image icon** next to the message box (or paste an image into the box).
2. Choose a JPEG, JPG, PNG or WEBP file of 5 MB or less. A preview appears; click × to cancel.
3. Optionally type a caption, then press **Enter** or click **Send**. An upload progress bar is shown on the message.
4. The other session receives the image in real time. Click any image to view it full size.

The operator can send images to users the same way. Unsupported types (such as GIF) and oversized files are rejected both in the browser and on the server, which also checks the file's real content (magic bytes), not just its name.

## 15. Troubleshooting

| Problem | Fix |
|---|---|
| Website shows "Gravitas AI needs configuration" | `client/.env` is missing or incomplete. Fill it in and **restart** `npm run dev` (Vite only reads `.env` at startup). |
| API prints "The API cannot start because server/.env is incomplete" | Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`. |
| "Can't reach the Gravitas AI server" | The API isn't running, or `VITE_API_BASE_URL` is wrong. Open <http://localhost:5000/api/health>. |
| "Port 5000 is already in use" | Change `PORT` in `server/.env` **and** `VITE_API_BASE_URL` in `client/.env`, or stop the other process. |
| Browser console shows a CORS error / "This origin is not allowed" | Add the exact website origin (for example `http://localhost:5173`) to `CLIENT_ORIGIN` in `server/.env` (comma-separated for several) and restart the API. |
| "The database schema is missing or outdated" | Run the three migration files (step 9). |
| "Your account profile has not been created yet" | The account was created before migration 001 ran. Run migration 001 again; it backfills missing profiles. |
| "Incorrect email or password" | Check the credentials. Supabase passwords are case-sensitive. |
| "Please confirm your email address first" | Click the confirmation email, or turn off **Confirm email** for development (step 9). |
| "This account does not have operator access" | Run `assign_operator_role` for that email (step 11), then sign in again. |
| Messages only appear after refreshing | Run migration 003 (it adds the tables to the `supabase_realtime` publication) and check Database → Publications → `supabase_realtime`. A "Reconnecting to live updates…" banner means the Realtime connection is down. |
| No Online/typing status in the header | Presence uses private Realtime channels authorized by migration 003. Re-run it. Chat still works without presence. |
| "Image storage is not configured" | Run migration 003 (it creates the private `chat-attachments` bucket). |
| "Images must be 5 MB or smaller" | Use a smaller image. To raise the limit, change `MAX_UPLOAD_MB`, the bucket's file size limit (Storage → bucket settings) and `uploads.maxImageMb` in `shared/gravitas.config.json`. |
| "Session expired" | Your refresh token is no longer valid. Sign in again. |
| `npm` not recognised | Install Node.js LTS from <https://nodejs.org> and reopen PowerShell. |
| PowerShell blocks `npm` scripts ("running scripts is disabled") | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm.cmd` instead of `npm`. |

---

## Appendix A: REST API

All endpoints except `/health` require `Authorization: Bearer <Supabase access token>`. Responses use `{ "data": … }` on success and `{ "error": { "code", "message", "details?" } }` on failure.

| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/api/health` (`?deep=1` also checks the DB) | anyone | Health check |
| GET | `/api/auth/me` | signed in | Your profile (name, email, role, signed avatar URL) |
| GET | `/api/auth/role` | signed in | Your role |
| PATCH | `/api/auth/me` | signed in | Update display name `{ displayName }` |
| POST | `/api/auth/me/avatar` | signed in | Upload profile picture (multipart field `avatar`) |
| GET | `/api/conversations` | user: own · operator: all | List with previews and unread counts (`?search=&limit=`) |
| POST | `/api/conversations` | **user only** | Get or create your conversation for the active project (welcome message is inserted once) |
| GET | `/api/conversations/:id` | owner / operator | Conversation details |
| GET | `/api/conversations/:id/messages` | owner / operator | Messages, paginated: `?limit=30&before=<createdAt>` or `?after=<createdAt>` |
| POST | `/api/conversations/:id/messages` | owner / operator | Send `{ clientId, content?, attachmentPath? }`. Retrying the same `clientId` returns the original message instead of creating a duplicate |
| POST | `/api/conversations/:id/read` | owner / operator | Mark as read |
| POST | `/api/uploads/images` | owner / operator | Upload a chat image (multipart: `conversationId`, `clientId`, `image`) and get back a storage path |
| GET | `/api/messages/:id/attachment` | owner / operator | Fresh signed URL for an image message |

Sending an image takes two steps: (1) `POST /uploads/images` stores the file privately at `conversations/<conversation>/<sender>/<clientId>.<ext>`; (2) `POST /conversations/:id/messages` references that path. The server checks that the path belongs to this sender, conversation and message, and that the file exists.

## Appendix B: Security model

- **Identity** comes only from the verified Supabase JWT (`auth.getUser`). The sender id and role are derived from it, and any `senderId`/`senderRole` field in a request is rejected.
- **Authorization** is checked explicitly in the backend for every conversation, message and upload, because the service-role client bypasses RLS. A user who asks for another user's conversation gets `404`.
- **Row Level Security** is the second line of defence. Browsers (anon/publishable key) get read-only access to their own rows, and operators can read the inbox. Realtime events are filtered by these same policies.
- **Storage** is a private bucket written only by the backend after type, size and magic-byte checks. Clients only ever receive signed URLs, which expire after 1 hour by default.
- **Private Realtime channels** (`room:<conversationId>`) for presence and typing are authorized by policies on `realtime.messages`.
- **Other protections**: rate limits (global, plus per user for messages, uploads and profile changes), Helmet security headers, CORS restricted to `CLIENT_ORIGIN`, a 32 kB JSON body limit, and centralised error handling with no stack traces in responses.
- **Passwords** are handled entirely by Supabase Auth, which stores them hashed and never in our tables. Message text is rendered as plain text by React, so no HTML injection is possible.
- **Secrets**: the service-role key exists only in `server/.env`. `npm run verify:bundle` scans the production bundle to prove it isn't there.

## Appendix C: How message alignment works

One reusable `ChatMessage` component renders every bubble. Its side is decided by `isOwnMessage(message, viewer)` in `client/src/utils/messages.js`:

- When the message's `sender_id` equals the signed-in account's id, the message is **yours** and goes on the **right**.
- In the operator console, operators share the "Gravitas AI" persona, so every Gravitas AI message counts as "ours" and goes on the right, including the automated welcome message and replies from another operator.
- Everything else goes on the **left**.

The result: users see their own messages on the right and Gravitas AI on the left, while operators see users on the left and Gravitas AI on the right. Unit tests in `client/test/messages.test.js` cover both views.
