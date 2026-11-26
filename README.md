Northstar Support

Northstar Support is a helpdesk application where customers can raise support tickets and track their progress. Admins can view incoming tickets, manage them, reply to users, and update their status.

I built this project to cover the main parts of a support system, including authentication, role-based access, ticket management, database operations, and API development.

Live links

- Frontend: https://north-star-omanshu.vercel.app
- Backend API: https://northstar-31ju.onrender.com
- Health check: https://northstar-31ju.onrender.com/health
- GitHub: https://github.com/Omanshu09/NorthStar
- Live: https://north-star-omanshu.vercel.app/

Features

- User registration and login with cookie-based JWT authentication.
- Separate USER and ADMIN roles, with access checks on the backend.
- Customers can create, view, edit and delete their own open tickets.
- Ticket search, filtering and pagination.
- Admin dashboard to view and manage tickets.
- Admins can assign ticket priority and update ticket status.
- Comments and conversations on tickets.
- Activity history for ticket updates.
- In-app notifications.
- Input validation and centralized error handling.
- Login rate limiting and restricted CORS settings.
- Responsive interface for desktop and mobile screens.

Technologies used

Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Lucide React

Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- bcryptjs
- Zod

Database and testing
- PostgreSQL
- Neon
- Vitest
- Supertest
- Postman

Project structure

NorthStar/
├── backend/       Express API, Prisma schema, migrations and tests
├── frontend/      Next.js application
├── postman/       Postman API collection
├── API_DOCUMENTATION.md
├── render.yaml
├── vercel.json
├── package.json
└── README.md


How the application works

The frontend communicates with the Express backend through API requests. The backend handles authentication, permissions, validation, ticket operations and database access.

When a user logs in, the server creates a JWT and stores it in an HTTP-only cookie. The browser sends this cookie with later API requests. This keeps the session token out of JavaScript-accessible storage.

The backend checks the user's role before allowing access to admin routes. Regular users can only access their own tickets, while admins can manage tickets across the system.

Database design

The application uses PostgreSQL, with Prisma handling database queries and relationships.

The main models are:

- User: Stores account details, password hashes, and user roles.
- Ticket: Stores the subject, description, category, priority, status, and ticket owner.
- Comment: Stores messages added to a ticket by users or admins.
- ActivityLog: Records actions performed on tickets.
- Notification: Stores in-app notifications for users.

A user can create multiple tickets. Each ticket can have multiple comments, activity records and notifications. These records are connected through database relations.

Ticket-related records use cascading deletes so that removing a ticket also removes its associated records.

Requirements

To run the project locally, you need:

- Node.js 20 or newer
- npm
- A PostgreSQL database, either local or hosted on Neon

Local setup

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Omanshu09/NorthStar.git
cd NorthStar
npm install
```

Create the environment files:

- Copy `backend/.env.example` to `backend/.env`.
- Copy `frontend/.env.example` to `frontend/.env.local`.

Set the backend environment variables:

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_long_random_secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
NODE_ENV=development
ADMIN_NAME="Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_password_at_least_12_characters"
```

Set the frontend environment variable:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

The root `.env.example` file also lists the environment variables used by the project.

Database setup

Run the database migration:

```bash
npm run db:migrate -w backend
```

Create the administrator account:

```bash
npm run db:seed -w backend
```

The seed script uses `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` to create or update the administrator account. The password must contain at least 12 characters.

The seed script also creates two sample customer accounts and sample tickets when the database has no tickets. These are intended for local testing. Do not use the sample accounts in a production database.

Run the application

Start the frontend and backend from the project root:

```bash
npm run dev
```

The application will be available at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

Useful commands

Build the backend:

```bash
npm run build -w backend
```

Build the frontend:

```bash
npm run build -w frontend
```

Run backend tests:

```bash
npm test -w backend
```

The tests use the database configured through `DATABASE_URL`. Use a separate test database rather than your main development or production database.

API documentation

The API endpoints and their request and response formats are documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

The project also includes a Postman collection in the `postman/` folder for testing the API.

The API uses a consistent response structure. Successful responses contain a `data` property, while errors contain an `error` property.

Login sets the `support_token` HTTP-only cookie. Browser requests include credentials so that the session cookie is sent to the backend.

Implementation decisions

A few choices I made while building the application:

- HTTP-only cookies for authentication: The session token is not stored in local storage. The browser sends the cookie with API requests.
- Backend role checks: Admin permissions are checked by the server, not just by hiding frontend controls.
- Prisma with PostgreSQL: Prisma provides a clear way to define relationships and manage database operations.
- Validation on the backend: Incoming data is checked before it reaches the database.
- Separate activity and notification records: Ticket actions can be tracked and users can see updates in the application.

Ticket creation, edits, status changes, resolution and comments also publish events through Node.js's in-process `EventEmitter`. Registered listeners create activity records and notifications after the main database operation succeeds.

This event handling is lightweight. Events are not stored in a durable queue and are not retried if a handler fails or the process stops. A transactional outbox and background worker would be a suitable next step if stronger delivery guarantees were needed.

Production deployment

The application is deployed using Vercel, Render and Neon.

Frontend on Vercel

The Next.js frontend is deployed on Vercel. The project root is set to `frontend` and `NEXT_PUBLIC_API_URL` points to the deployed backend API.

Backend on Render

The Express API is deployed as a Render Web Service. The backend connects to the PostgreSQL database hosted on Neon.

The backend uses environment variables for the database connection, JWT secret, frontend origin, and runtime settings. Production cookies use `Secure` and `SameSite=None`, so both the frontend and backend must use HTTPS.

The Render free instance may sleep when it is not being used. Its first request after a period of inactivity can take longer while the service starts.

Known limitations

- There is no password reset or email delivery feature.
- Notifications are available inside the application only.
- Event handling uses an in-process event emitter, so it does not provide durable delivery or automatic retries.
- Backend tests require a separate PostgreSQL test database.

Future improvements

Some things I would like to add in a future version:

- Password reset and email notifications.
- More detailed admin and ticket analytics.
- Durable background jobs for activity and notification processing.
- Better automated test coverage for frontend and backend workflows.
- More advanced ticket assignment and filtering options.
