-- Phase 2 scheduling additions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add timezone to tutor availability
ALTER TABLE "TutorAvailability" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- Tutor unavailability blocks
CREATE TABLE "TutorUnavailability" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tutorId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ NOT NULL,
    "endAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "TutorUnavailability_tutorId_startAt_endAt_idx" ON "TutorUnavailability" ("tutorId", "startAt", "endAt");

ALTER TABLE "TutorUnavailability"
  ADD CONSTRAINT "TutorUnavailability_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Session status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionStatus') THEN
    CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED');
  ELSE
    -- add missing values if enum already exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = 'SessionStatus'::regtype) THEN
      ALTER TYPE "SessionStatus" ADD VALUE 'IN_PROGRESS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COMPLETED' AND enumtypid = 'SessionStatus'::regtype) THEN
      ALTER TYPE "SessionStatus" ADD VALUE 'COMPLETED';
    END IF;
  END IF;
END$$;

-- Class schedule per class
CREATE TABLE "ClassSchedule" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "classId" TEXT NOT NULL UNIQUE,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrenceRule" JSONB,
    "explicitSessions" JSONB,
    "totalSessions" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "ClassSchedule"
  ADD CONSTRAINT "ClassSchedule_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sessions generated from schedules
CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "classId" TEXT NOT NULL,
    "scheduledStartAt" TIMESTAMPTZ NOT NULL,
    "scheduledEndAt" TIMESTAMPTZ NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "disputeFlaggedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Session_classId_scheduledStartAt_idx" ON "Session" ("classId", "scheduledStartAt");
CREATE INDEX "Session_scheduledStartAt_scheduledEndAt_idx" ON "Session" ("scheduledStartAt", "scheduledEndAt");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
