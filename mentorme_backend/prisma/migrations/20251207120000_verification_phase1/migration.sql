-- Add verification status enum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- Extend TutorProfile for verification data
ALTER TABLE "TutorProfile"
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "nationalIdNumber" TEXT,
  ADD COLUMN "nationalIdFrontImageUrl" TEXT,
  ADD COLUMN "nationalIdBackImageUrl" TEXT,
  ADD COLUMN "proofDocuments" JSONB,
  ADD COLUMN "certificatesDetail" JSONB,
  ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "verificationReviewedAt" TIMESTAMP(3),
  ADD COLUMN "verificationNotes" TEXT;

-- Keep backward compatibility with existing verified flag
UPDATE "TutorProfile"
SET "verificationStatus" = CASE WHEN "verified" = true THEN 'VERIFIED' ELSE 'UNVERIFIED' END;

-- Unique constraint for national ID (allows NULLs)
CREATE UNIQUE INDEX "TutorProfile_nationalIdNumber_key" ON "TutorProfile"("nationalIdNumber");

-- Helpful index for moderation/status filtering
CREATE INDEX "TutorProfile_verificationStatus_idx" ON "TutorProfile"("verificationStatus");
