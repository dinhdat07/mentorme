# MentorMe

MentorMe is a full-stack platform that connects students with qualified tutors for mentorship sessions. The repository contains a TypeScript/Express API and a Next.js web client housed in sibling directories.
<p align="center">
  <img src="https://github.com/user-attachments/assets/8d332212-b312-4911-9e7d-0a19b63b8fa4"
       alt="mentorme_logo" 
       width="400" 
       height="300" />
</p>

## Repository Layout

- `mentorme_backend/` – REST API built with Express, Prisma, and PostgreSQL
- `mentorme_frontend/` – Next.js 16 web client with Tailwind UI

Each folder has its own README for details on configuration, scripts, and project structure.

## Requirements

- Node.js 20+
- PostgreSQL database (for the backend)

## Quick Start

```bash
# Backend
cd mentorme_backend
npm install
# create .env with DATABASE_URL, JWT_SECRET, PORT
npx prisma migrate deploy
npm run dev

# Frontend
cd ../mentorme_frontend
npm install
# create .env.local with NEXT_PUBLIC_API_BASE_URL
npm run dev
```

The backend listens on `http://localhost:4000` by default and the frontend on `http://localhost:3000`. Update `NEXT_PUBLIC_API_BASE_URL` to match wherever the API is reachable.

## Development Tips

- Commit changes from backend and frontend separately to keep diffs focused.
- Keep `.env` files out of version control (see `.gitignore` files in each package).
- Run `npm run lint` in both packages before opening a pull request.
