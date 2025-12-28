import { VerificationStatus } from "@prisma/client";

export function maskNationalId(value?: string | null): string | null {
  if (!value) return null;
  const len = value.length;
  if (len <= 4) return "*".repeat(len);
  const visible = value.slice(-4);
  const masked = "*".repeat(len - 4);
  return `${masked}${visible}`;
}

type TutorLike = {
  nationalIdNumber?: string | null;
  nationalIdFrontImageUrl?: string | null;
  nationalIdBackImageUrl?: string | null;
  proofDocuments?: unknown;
  certificatesDetail?: unknown;
  verificationNotes?: string | null;
  verificationSubmittedAt?: Date | null;
  verificationReviewedAt?: Date | null;
  verificationStatus?: VerificationStatus;
  verified?: boolean;
  user?: any;
  [key: string]: any;
};

export function sanitizeTutorForPublic<T extends TutorLike>(
  tutor: T,
  opts?: { maskNationalId?: (value?: string | null) => string | null }
): T {
  const clone: TutorLike = { ...tutor };
  const masker = opts?.maskNationalId ?? maskNationalId;
  if ("nationalIdNumber" in clone) {
    clone.nationalIdNumber = masker(clone.nationalIdNumber);
  }
  // Remove sensitive artifacts for public exposure
  delete clone.nationalIdFrontImageUrl;
  delete clone.nationalIdBackImageUrl;
  delete clone.proofDocuments;
  delete clone.certificatesDetail;
  delete clone.verificationNotes;
  return clone as T;
}
