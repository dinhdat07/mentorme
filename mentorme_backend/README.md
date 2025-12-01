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
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"
FRONTEND_URL="http://localhost:3000"
```

`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `FRONTEND_URL` are required. `PORT` defaults to `4000` when omitted.

Google OAuth: the backend initiates the flow at `/api/auth/google?role=STUDENT|TUTOR` and completes it at `/api/auth/google/callback`, then redirects back to `${FRONTEND_URL}/auth/google-callback` with a JWT token.

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

## Deploying to AWS (ECS + RDS)

This backend is ready to run as a container on ECS Fargate behind an Application Load Balancer (ALB), with PostgreSQL hosted on RDS and secrets in SSM/Secrets Manager.

1. **Build & push the image**
   - Install the Prisma CLI locally once if you need migrations: `npm install -D prisma@6.19.0`
   - Authenticate to ECR (`aws ecr get-login-password ... | docker login ...`)
   - `docker build -t <account>.dkr.ecr.<region>.amazonaws.com/mentorme-backend:latest .`
   - `docker push <account>.dkr.ecr.<region>.amazonaws.com/mentorme-backend:latest`

2. **Provision AWS resources**
   - **ECR** repository for the image.
   - **RDS PostgreSQL** instance inside a VPC. Security groups should allow traffic only from the ECS service.
   - **Secrets/Parameters**: store `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, and `EMBEDDING_API_URL` (optional) in SSM Parameter Store or Secrets Manager.
   - **ECS Fargate service** behind an **ALB**:
     - Task definition: container port `4000`, command `node dist/index.js`, `NODE_ENV=production`.
     - Wire SSM/Secrets to environment variables; set CPU/memory (e.g., 0.5 vCPU / 1GB).
     - ALB target group health check path `/health` (HTTP 200).
     - Security groups: ALB accepts 80/443; ALB → ECS task on 4000; ECS → RDS on 5432.

3. **Run migrations**
   - From CI or a one-off ECS task: `npx prisma@6.19.0 migrate deploy`
   - Ensure `DATABASE_URL` for the RDS instance is available when running the migration task.

4. **Logs & monitoring**
   - Send container logs to CloudWatch Logs.
   - Enable ALB access logs.
   - Add CloudWatch alarms on 5xx rate, high latency, CPU/memory, and RDS connectivity.

5. **Deploy flow (GitHub Actions outline)**
   - Backend workflow: `npm ci && npm test && npm run build`, `docker build`, `docker push`, `aws ecs update-service --force-new-deployment`.
   - Separate step or job to run `prisma migrate deploy` against the live DB before updating the service.
