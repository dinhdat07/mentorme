# Tutor Student Matching Platform - Setup Guide

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Install shadcn/ui Components
This project uses shadcn/ui components. Install them with:

\`\`\`bash
npx shadcn@latest init
\`\`\`

When prompted, use these settings:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 3. Install Required Components
Run these commands to install the UI components used in the project:

\`\`\`bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add toaster
\`\`\`

### 4. Environment Variables
Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
\`\`\`

Update `NEXT_PUBLIC_API_BASE_URL` to match your backend API URL.

### 5. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable React components
- `hooks/` - Custom React hooks for API calls and state management
- `lib/` - Utility functions and types
- `public/` - Static assets

## Features

- **Authentication** - JWT-based login/register system
- **Role-based Access** - Separate interfaces for students, tutors, and admins
- **Student Dashboard** - Browse tutors, manage bookings, leave reviews
- **Tutor Dashboard** - Manage profile, classes, and bookings
- **Admin Dashboard** - Approve tutors, monitor bookings and classes
- **Responsive Design** - Works on desktop and mobile devices

## Default Credentials (for testing)
Contact your backend team for test user credentials.
