# API documentation

Base path: `/api`. JSON responses use `{ "data": ... }`; errors use `{ "error": "..." }`. Authentication is an HTTP-only `support_token` cookie. Send requests with credentials enabled. IDs are opaque strings.

## Authentication

| Method | Path | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ "name": "A User", "email": "a@example.com", "password": "at-least-10-chars" }` |
| POST | `/auth/login` | Public | `{ "email": "a@example.com", "password": "..." }` |
| POST | `/auth/logout` | Public | none |
| GET | `/auth/me` | Signed in | none |

Registration always creates a USER. Login sets the cookie. Logout clears it.

## Tickets and dashboards

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/dashboard/stats` | Signed in | Counts and recently updated tickets scoped to the user (or all tickets for admins) |
| POST | `/tickets` | Signed in | Create ticket; body has `title`, `description`, `category`, optional `priority` |
| GET | `/tickets` | Signed in | Own tickets, paginated |
| GET | `/tickets/:id` | Owner or admin | Ticket, comments, activity |
| PATCH | `/tickets/:id` | Owner, OPEN only | Update allowed title, description, category, priority fields |
| DELETE | `/tickets/:id` | Owner, OPEN only | Delete ticket |
| GET | `/admin/tickets` | Admin | All tickets |
| GET | `/admin/dashboard` | Admin | Overall counts and latest tickets |
| PATCH | `/admin/tickets/:id/status` | Admin | `{ "status": "IN_PROGRESS" }` |
| PATCH | `/admin/tickets/:id/priority` | Admin | `{ "priority": "HIGH" }` |

List query parameters: `page` (1-based), `limit` (1–100), `search`, `status`, `priority`, `category`, `sort` (`createdAt` or `updatedAt`), `order` (`asc` or `desc`). Response includes `data` and `{ pagination: { page, limit, total, pages } }`.

## Conversation and updates

| Method | Path | Access | Body |
|---|---|---|---|
| GET | `/tickets/:id/comments` | Owner or admin | none |
| POST | `/tickets/:id/comments` | Owner or admin | `{ "content": "Reply text" }` |
| GET | `/tickets/:id/activity` | Owner or admin | none |
| GET | `/notifications` | Signed in | none |
| PATCH | `/notifications/:id/read` | Notification owner | none |
| PATCH | `/notifications/read-all` | Signed in | none |

Health probe: `GET /health` returns `{ "status": "ok" }`.

## Example

```http
POST /api/tickets
Content-Type: application/json
Cookie: support_token=...

{"title":"Unable to sign in","description":"The password reset link returns an error.","category":"Account Issues","priority":"HIGH"}
```

Successful creation returns HTTP 201 and the new ticket under `data`. Validation failures return 400; missing/invalid sessions return 401; non-admin role checks return 403; inaccessible tickets return 404.
