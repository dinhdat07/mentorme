-- Phase 3: session lifecycle and class progress
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extend SessionStatus enum if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SessionStatus'
      AND e.enumlabel = 'IN_PROGRESS'
  ) THEN
    ALTER TYPE "SessionStatus" ADD VALUE 'IN_PROGRESS';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SessionStatus'
      AND e.enumlabel = 'COMPLETED'
  ) THEN
    ALTER TYPE "SessionStatus" ADD VALUE 'COMPLETED';
  END IF;
END $$;


-- Class lifecycle status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClassLifecycleStatus') THEN
    CREATE TYPE "ClassLifecycleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
  END IF;
END$$;

ALTER TABLE "Class"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "ClassLifecycleStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "totalSessions" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sessionsCompleted" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "tutorStartConfirmedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "studentStartConfirmedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "tutorCompleteConfirmedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "studentCompleteConfirmedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "disputeFlaggedAt" TIMESTAMPTZ;
