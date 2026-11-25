# Northstar Support

A full-stack helpdesk for customer requests and the administrators who manage them. Users can create, track, edit open requests, and converse with support. Admins get a queue with ticket ownership, priority and status controls. The frontend uses a real Express API backed by PostgreSQL through Prisma.

## Features

- Cookie-based JWT authentication, bcrypt password hashes, and server-enforced USER/ADMIN roles.
- Ticket creation, search, filtering, pagination, owner-only access, and open-ticket editing/deletion.
- Admin queue, status and priority management, comments, activity history, and dashboard counts.
- In-app notifications, centralized validation/errors, Helmet, restricted credentialed CORS, and login rate limiting.
- Responsive Next.js interface with ticket details, conversation, and notification views.

## Stack and structure

Next.js, React, TypeScript, Tailwind CSS, React Hook Form, Zod, Lucide React; Express, Zod, JWT, bcryptjs; PostgreSQL and Prisma; Vitest and Supertest.

```text
support-ticket-system/
  backend/      Express API, Prisma schema/migration, seed, tests
  frontend/     Next.js application
  postman/      API collection
  API_DOCUMENTATION.md
  render.yaml
  vercel.json
```

The API owns authentication, authorization, validation, business rules, and persistence. The browser only holds an HTTP-only session cookie and calls the API with credentials. `User` owns tickets and comments; tickets own comments, activity rows, and notifications. Cascading deletes keep ticket-related records consistent.

## Requirements and local setup

Use Node.js 20 or newer, npm, and a PostgreSQL database (local or Neon). From the project root:

```bash
cp .env.example .env
npm install
```

Copy `backend/.env.example` to `backend/.env`, then set `DATABASE_URL` to a PostgreSQL connection string and `JWT_SECRET` to a long random value. Keep `FRONTEND_URL=http://localhost:3000`, `PORT=4000`, and `NODE_ENV=development`. Copy `frontend/.env.example` to `frontend/.env.local`; set `NEXT_PUBLIC_API_URL=http://localhost:4000/api`. The root `.env.example` lists all variables for reference.

Apply migrations and create an administrator:

```bash
npm run db:migrate -w backend
npm run db:seed -w backend
```

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` before seeding. The password must be at least 12 characters. The two seeded user accounts are `alex@example.com` and `jamie@example.com`; their demo password is `Demo-{email}-Password-2026` (for example `Demo-alex@example.com-Password-2026`). Change these accounts immediately if the seed is used outside a local demo. Seeding can be repeated safely; sample tickets are only created when the database has no tickets.

Run both applications with `npm run dev`. The UI is at `http://localhost:3000`, API at `http://localhost:4000`, and health probe at `http://localhost:4000/health`.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection |
| `JWT_SECRET` | Backend | Signs session tokens; never expose to the browser |
| `FRONTEND_URL` | Backend | Exact allowed frontend origin |
| `PORT` | Backend | HTTP port (Render supplies this) |
| `NODE_ENV` | Both | Development/production cookie and runtime behavior |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed | Controlled administrator provisioning |
| `NEXT_PUBLIC_API_URL` | Frontend | Public API base URL, such as `https://api.example.com/api` |

## Database and scripts

Prisma models and the initial SQL migration are in `backend/prisma`. Run `npm run db:migrate -w backend` locally and `npm run db:deploy -w backend` in production. Generate the client with `npm run build -w backend` or `npx prisma generate --schema backend/prisma/schema.prisma`. Use `npm run db:seed -w backend` for the safe demo seed.

```bash
npm run build -w backend
npm run build -w frontend
npm test -w backend
```

Tests use the `DATABASE_URL` database, so copy `backend/.env.example` to `backend/.env` and point `DATABASE_URL` at an isolated test database before running them. The app does not automatically reset the database; its test fixtures are removed after the suite completes.

## API

All routes are documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md). Requests return a `data` property; errors return `error`. Login sets the `support_token` HttpOnly cookie. Browser fetches use `credentials: 'include'`. The Postman collection stores cookies in Postman's cookie jar after login. Admin routes always check role on the server.

## Event handling

Ticket creation, edits, status changes, resolution, and comments publish named events through Node's in-process `EventEmitter`. Registered listeners write activity records and deliver in-app notifications after the primary database write succeeds. Handler failures are logged without changing the successful primary response. This is deliberately lightweight: events are not durable, not retried, and can be lost if the process exits during handling. Use a transactional outbox and durable worker if delivery guarantees become a production requirement.

## Production deployment

### Neon

1. Create a PostgreSQL project/database in Neon.
2. Copy its pooled connection string into the backend `DATABASE_URL` (keep SSL enabled).
3. Keep a direct connection string available if your migration workflow requires it.

### Render API

1. Push this folder to a Git repository and create a Render Web Service from it.
2. Use the root `render.yaml` blueprint or configure root directory `backend`, build command `npm install && npm run build`, start command `npm run db:deploy && npm start`, and health path `/health`.
3. Set `DATABASE_URL`, `JWT_SECRET` (use a generated secret), `FRONTEND_URL` (the deployed Vercel origin), and `NODE_ENV=production`.
4. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` only if running the seed command from a controlled one-off shell. Never use demo passwords in production.

Render free instances may sleep; the first request can take longer while the service wakes. The UI displays API errors, and retrying after the health endpoint responds is sufficient.

### Vercel frontend

1. Import the repository into Vercel and set the project root to `frontend`.
2. Set `NEXT_PUBLIC_API_URL` to `https://<render-service>.onrender.com/api`.
3. Deploy, then set the Render `FRONTEND_URL` to the exact Vercel origin and redeploy the API.
4. Production cookies use `Secure` and `SameSite=None`; both services must use HTTPS. Configure the same API origin in all environments.

## Known limitations

- Event delivery is in-process and best-effort, as described above.
- There is no password reset or email delivery; notifications are in-app.
- This repository contains no real deployment credentials and does not claim a deployment has been performed.
- The API test suite needs a separate PostgreSQL test database. No external database credentials are included.
