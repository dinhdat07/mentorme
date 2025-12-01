import { BookingStatus, PrismaClient } from "@prisma/client";

export interface TutorTrustInput {
  verified: boolean;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  totalCompletedBookings: number;
  totalCancelledBookings: number;
  avgResponseTimeSeconds: number;
  policyViolationsCount: number;
}

export function calculateTrustScore(input: TutorTrustInput): number {
  const verificationScore = input.verified ? 15 : 0;
  const reviewsScore = Math.min(input.totalReviews, 20);
  const profileScore = Math.min(35, verificationScore + reviewsScore);

  const completionRate =
    input.totalBookings > 0 ? input.totalCompletedBookings / input.totalBookings : 1;
  let completionScore = 5;
  if (completionRate >= 0.9) {
    completionScore = 25;
  } else if (completionRate >= 0.75) {
    completionScore = 18;
  } else if (completionRate >= 0.5) {
    completionScore = 10;
  }

  const clampedRating = Math.max(0, Math.min(5, input.averageRating));
  const ratingScore = (clampedRating / 5) * 25;

  let responseScore = 2;
  if (input.avgResponseTimeSeconds < 300) {
    responseScore = 10;
  } else if (input.avgResponseTimeSeconds < 3600) {
    responseScore = 7;
  } else if (input.avgResponseTimeSeconds < 21600) {
    responseScore = 4;
  }

  let policyScore = 0;
  let policyPenalty = 0;
  if (input.policyViolationsCount === 0) {
    policyScore = 5;
  } else if (input.policyViolationsCount === 1) {
    policyScore = 2;
  } else {
    policyPenalty = 10;
  }

  const totalScore =
    profileScore + completionScore + ratingScore + responseScore + policyScore - policyPenalty;

  return Math.min(100, Math.max(0, totalScore));
}

export async function recomputeAndUpdateTutorTrustScore(
  prisma: PrismaClient,
  tutorId: string
): Promise<void> {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    select: {
      id: true,
      verified: true,
      policyViolationsCount: true,
      avgResponseTimeSeconds: true,
    },
  });

  if (!tutorProfile) {
    throw new Error(`TutorProfile not found for id ${tutorId}`);
  }

  const [bookingStats, completedStats, cancelledStats, reviewStats] = await Promise.all([
    prisma.booking.aggregate({
      _count: { _all: true },
      where: { tutorId },
    }),
    prisma.booking.aggregate({
      _count: { _all: true },
      where: { tutorId, status: BookingStatus.COMPLETED },
    }),
    prisma.booking.aggregate({
      _count: { _all: true },
      where: { tutorId, status: BookingStatus.CANCELLED },
    }),
    prisma.review.aggregate({
      _count: { _all: true },
      _avg: { rating: true },
      where: { tutorId },
    }),
  ]);

  const totalBookings = bookingStats._count?._all ?? 0;
  const totalCompletedBookings = completedStats._count?._all ?? 0;
  const totalCancelledBookings = cancelledStats._count?._all ?? 0;
  const totalReviews = reviewStats._count?._all ?? 0;
  const averageRating = reviewStats._avg.rating ?? 0;

  const trustScore = calculateTrustScore({
    verified: tutorProfile.verified,
    averageRating,
    totalReviews,
    totalBookings,
    totalCompletedBookings,
    totalCancelledBookings,
    avgResponseTimeSeconds: tutorProfile.avgResponseTimeSeconds,
    policyViolationsCount: tutorProfile.policyViolationsCount,
  });

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      trustScore,
      lastTrustScoreUpdatedAt: new Date(),
      totalBookings,
      totalCancelledBookings,
      totalCompletedBookings,
      totalReviews,
      averageRating,
    },
  });
}
