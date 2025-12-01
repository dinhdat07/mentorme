# MentorMe Frontend

Next.js 16 + Tailwind CSS application that delivers the MentorMe user experience for students, tutors, and admins. It consumes the MentorMe backend REST API and manages auth tokens in `localStorage`.

## Tech Stack

- Next.js App Router with React Server Components
- Tailwind CSS 4 and radix-ui primitives for theming
- React Hook Form + Zod validation
- SWR data hooks for cached API reads

## Prerequisites

- Node.js 20+ (matches Next.js requirement)
- Backend API running locally or remotely

## Environment Variables

Create `mentorme_frontend/.env.local` with:

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_USE_GOOGLE_AUTH="true" # set to "false" to hide Google auth buttons
```

Point the value to wherever the backend is hosted.

## Getting Started

```bash
# Install dependencies
npm install

# Run the local dev server
npm run dev
```

Visit `http://localhost:3000` for the web app. Authentication state is persisted in `localStorage`, so use the logout action or clear the key when testing.

## Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start Next.js in development mode     |
| `npm run build` | Create an optimized production build  |
| `npm start`     | Serve the production build            |
| `npm run lint`  | Run ESLint (Next + Tailwind config)   |

## Project Structure

- `app/` – App Router pages, layouts, and route handlers
- `components/` – UI building blocks (cards, forms, dialogs, etc.)
- `hooks/` – Data-fetching and state helpers
- `lib/api-client.ts` – Fetch wrapper that automatically adds tokens

## Connecting to the Backend

During development, start the backend first (`npm run dev` inside `mentorme_backend`) so the frontend can hit `http://localhost:4000`. Update `NEXT_PUBLIC_API_BASE_URL` when targeting another environment (staging, production, etc.).
