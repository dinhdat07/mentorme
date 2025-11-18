import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { recalculateTutorStats } from "../services/tutorStats";

const router = Router();

const createSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.post("/", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!student) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
    });

    if (!booking || booking.studentId !== student.id) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({ message: "Booking not completed" });
    }

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        studentId: student.id,
        tutorId: booking.tutorId,
        rating: payload.rating,
        comment: payload.comment ?? null,
      },
    });

    await recalculateTutorStats(booking.tutorId);

    return res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    if ((error as any)?.code === "P2002") {
      return res.status(400).json({ message: "Booking already has review" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
