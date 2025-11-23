import { BookingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const recalculateTutorStats = async (tutorId: string) => {
  const [reviewAgg, completedCount] = await Promise.all([
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { tutorId },
    }),
    prisma.booking.count({
      where: { tutorId, status: BookingStatus.COMPLETED },
    }),
  ]);

  const averageRating = reviewAgg._avg.rating ?? 0;
  const totalReviews = reviewAgg._count.rating;
  const totalCompletedBookings = completedCount;

  const trustScore = Math.min(
    100,
    10 +
      totalCompletedBookings * 2.5 + // reward delivered lessons
      averageRating * 12 + // strong weight for quality
      Math.min(totalReviews, 20) * 1.5 // slight boost for volume (capped)
  );

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: {
      averageRating,
      totalReviews,
      totalCompletedBookings,
      trustScore,
    },
  });
};
