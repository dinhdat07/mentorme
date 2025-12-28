CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PaymentStatus enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
  END IF;
END$$;

-- LedgerType enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerType') THEN
    CREATE TYPE "LedgerType" AS ENUM ('DEPOSIT', 'RELEASE_TO_TUTOR', 'PLATFORM_FEE', 'REFUND');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "PaymentIntent" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "classId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "providerRef" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "PaymentIntent_classId_idx" ON "PaymentIntent"("classId");
CREATE INDEX IF NOT EXISTS "PaymentIntent_payerId_idx" ON "PaymentIntent"("payerId");

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT "PaymentIntent_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentIntent"
  ADD CONSTRAINT "PaymentIntent_payerId_fkey"
  FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "EscrowAccount" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "classId" TEXT UNIQUE NOT NULL,
    "totalDeposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "EscrowAccount"
  ADD CONSTRAINT "EscrowAccount_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "LedgerEntry" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    "classId" TEXT NOT NULL,
    "sessionId" TEXT,
    "paymentIntentId" TEXT,
    "type" "LedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_paymentIntentId_fkey"
  FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "LedgerEntry_classId_createdAt_idx" ON "LedgerEntry"("classId", "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "ledger_session_unique" ON "LedgerEntry"("type", "sessionId");
