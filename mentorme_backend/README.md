# MentorMe Backend

Express + TypeScript API that powers MentorMe's scheduling, booking, and review workflows. It exposes versioned routes under `/api/*` and uses Prisma as the ORM for Postgres.

## Tech Stack

- Node.js 20+, Express 5, Helmet, CORS
- TypeScript with `ts-node-dev` for local hot reloads
- Prisma ORM targeting PostgreSQL
- JWT-based auth with bcrypt password hashing

## Prerequisites

- Node.js 20 or newer
- PostgreSQL instance reachable from this service

## Environment Variables

Create a `.env` file in `mentorme_backend/`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/mentorme"
JWT_SECRET="replace-with-long-random-string"
PORT=4000
```

`DATABASE_URL` and `JWT_SECRET` are required. `PORT` defaults to `4000` when omitted.

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations if needed
npx prisma migrate deploy   # or migrate dev while iterating

# Start the dev server with reload
npm run dev
```

The API listens on `http://localhost:4000` by default. A basic health probe is available at `/health`.

## Scripts

| Command        | Description                               |
| -------------- | ----------------------------------------- |
| `npm run dev`  | Start Express via `ts-node-dev`           |
| `npm run build`| Compile TypeScript to `dist/`             |
| `npm start`    | Run the compiled server (`node dist`)     |
| `npm run lint` | Type-check the project without emitting   |

## Project Structure

- `src/config` – environment management
- `src/routes` – route definitions (`/api/auth`, `/api/students`, etc.)
- `src/services` – domain logic invoked by the routes
- `prisma/` – Prisma schema and migrations

## Testing API Locally

Use any REST client (Insomnia, Postman, VS Code `rest` files) to call the endpoints. Enable an `Authorization: Bearer <token>` header when exercising protected routes such as students/tutors CRUD.
