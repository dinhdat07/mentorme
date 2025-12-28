import { PrismaClient, VerificationStatus } from "@prisma/client";

const VS =
  VerificationStatus ?? {
    UNVERIFIED: "UNVERIFIED",
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  };

export type VerificationSubmitPayload = {
  nationalIdNumber: string;
  nationalIdFrontImageUrl: string;
  nationalIdBackImageUrl: string;
  proofDocuments?: unknown;
  certificatesDetail?: unknown;
};

export async function submitTutorVerification(
  prisma: PrismaClient,
  tutorId: string,
  payload: VerificationSubmitPayload
) {
  const current = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
  if (!current) {
    throw new Error("Tutor not found");
  }
  const status = (current.verificationStatus as any) ?? VS.UNVERIFIED;
  const allowed =
    status === VS.UNVERIFIED || status === VS.REJECTED || status === VS.VERIFIED;
  if (!allowed) {
    throw new Error("Verification submission not allowed in current status");
  }
  // If VERIFIED submits again, revert to PENDING
  return prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      nationalIdNumber: payload.nationalIdNumber,
      nationalIdFrontImageUrl: payload.nationalIdFrontImageUrl,
      nationalIdBackImageUrl: payload.nationalIdBackImageUrl,
      proofDocuments: payload.proofDocuments ?? null,
      certificatesDetail: payload.certificatesDetail ?? null,
      verificationStatus: VS.PENDING as any,
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: null,
      verificationNotes: null,
      verified: false,
    },
  });
}

export async function approveTutorVerification(
  prisma: PrismaClient,
  tutorId: string,
  note?: string
) {
  const current = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
  if (!current) throw new Error("Tutor not found");
  if (current.verificationStatus !== VS.PENDING) {
    throw new Error("Only pending verifications can be approved");
  }
  return prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      verificationStatus: VS.VERIFIED as any,
      verificationReviewedAt: new Date(),
      verificationNotes: note ?? null,
      verified: true,
    },
  });
}

export async function rejectTutorVerification(
  prisma: PrismaClient,
  tutorId: string,
  note?: string
) {
  const current = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
  if (!current) throw new Error("Tutor not found");
  if (current.verificationStatus !== VS.PENDING) {
    throw new Error("Only pending verifications can be rejected");
  }
  return prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      verificationStatus: VS.REJECTED as any,
      verificationReviewedAt: new Date(),
      verificationNotes: note ?? null,
      verified: false,
    },
  });
}
