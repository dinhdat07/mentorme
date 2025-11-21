import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middleware/auth";
import {
  BookingStatus,
  CancelledBy,
  ClassStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";
import { recalculateTutorStats } from "../services/tutorStats";

const router = Router();

const createSchema = z.object({
  classId: z.string().uuid(),
  isTrial: z.boolean().optional().default(false),
  requestedHoursPerWeek: z.number().int().min(1),
  startDateExpected: z.string(),
  noteFromStudent: z.string().optional(),
});

const getStudentIdByUser = async (userId: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  return student?.id;
};

const getTutorIdByUser = async (userId: string) => {
  const tutor = await prisma.tutorProfile.findUnique({ where: { userId } });
  return tutor?.id;
};


router.post("/", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);
    const studentId = await getStudentIdByUser(req.user!.id);
    if (!studentId) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    const classListing = await prisma.class.findUnique({
      where: { id: payload.classId },
    });

    if (!classListing || classListing.isDeleted || classListing.status !== ClassStatus.PUBLISHED) {
      return res.status(400).json({ message: "Class not available" });
    }

    const booking = await prisma.booking.create({
      data: {
        classId: classListing.id,
        studentId,
        tutorId: classListing.tutorId,
        status: BookingStatus.PENDING,
        isTrial: payload.isTrial,
        requestedHoursPerWeek: payload.requestedHoursPerWeek,
        startDateExpected: new Date(payload.startDateExpected),
        noteFromStudent: payload.noteFromStudent ?? null,
      },
    });

    return res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", authGuard(), async (req, res) => {
  try {
    const statusFilter = Array.isArray(req.query.status)
      ? (req.query.status as string[])
      : req.query.status
      ? [req.query.status as string]
      : undefined;

    const where: Record<string, unknown> = {};

    if (statusFilter) {
      where.status = { in: statusFilter as BookingStatus[] };
    }

    if (req.user!.role === UserRole.STUDENT) {
      const studentId = await getStudentIdByUser(req.user!.id);
      if (!studentId) {
        return res.status(400).json({ message: "Student profile not found" });
      }
      where.studentId = studentId;
    } else if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      if (!tutorId) {
        return res.status(400).json({ message: "Tutor profile not found" });
      }
      where.tutorId = tutorId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        class: true,
      },
    });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", authGuard(), async (req, res) => {
  try {
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        class: true,
        student: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    let isOwner = false;
    if (req.user!.role === UserRole.STUDENT) {
      const studentId = await getStudentIdByUser(req.user!.id);
      isOwner = !!studentId && booking.studentId === studentId;
    } else if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      isOwner = !!tutorId && booking.tutorId === tutorId;
    } else if (req.user!.role === UserRole.ADMIN) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.patch("/:id/confirm", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const tutorId = await getTutorIdByUser(req.user!.id);
    if (!tutorId) {
      return res.status(400).json({ message: "Tutor profile not found" });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.tutorId !== tutorId) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ message: "Only pending bookings can be confirmed" });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: booking.isTrial ? BookingStatus.TRIAL : BookingStatus.CONFIRMED,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const rejectSchema = z.object({
  reason: z.string().optional(),
});

router.patch("/:id/reject", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = rejectSchema.parse(req.body);
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const tutorId = await getTutorIdByUser(req.user!.id);
    if (!tutorId) {
      return res.status(400).json({ message: "Tutor profile not found" });
    }
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.tutorId !== tutorId) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ message: "Only pending bookings can be rejected" });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: payload.reason ?? "Rejected by tutor",
        cancelledBy: CancelledBy.TUTOR,
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const cancelSchema = z.object({
  reason: z.string().min(1),
});

router.patch("/:id/cancel", authGuard([UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const payload = cancelSchema.parse(req.body);
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      return res.status(400).json({ message: "Booking already finalized" });
    }

    let cancelledBy: CancelledBy;
    if (req.user!.role === UserRole.STUDENT) {
      const studentId = await getStudentIdByUser(req.user!.id);
      if (!studentId || booking.studentId !== studentId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      cancelledBy = CancelledBy.STUDENT;
    } else if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      if (!tutorId || tutorId !== booking.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      cancelledBy = CancelledBy.TUTOR;
    } else {
      cancelledBy = CancelledBy.SYSTEM;
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: payload.reason,
        cancelledBy,
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/complete", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const bookingId = req.params.id ?? "";
    if (!bookingId) {
      return res.status(400).json({ message: "Booking id is required" });
    }
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      return res.status(400).json({ message: "Booking already finalized" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutorId = await getTutorIdByUser(req.user!.id);
      if (!tutorId || tutorId !== booking.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.COMPLETED },
    });

    await recalculateTutorStats(booking.tutorId);

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
