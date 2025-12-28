import { Router } from "express";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { BookingStatus, ClassStatus, SessionStatus, UserRole } from "@prisma/client";

const router = Router();
const SS =
  SessionStatus ?? {
    SCHEDULED: "SCHEDULED",
    CANCELLED: "CANCELLED",
    MISSED: "MISSED",
  };

router.get("/tutor", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!tutor) return res.status(404).json({ message: "Tutor profile not found" });

    const now = new Date();
    const sessions = await prisma.session.findMany({
      where: {
        status: { not: SS.CANCELLED as any },
        scheduledEndAt: { gte: now },
        class: {
          tutorId: tutor.id,
          isDeleted: false,
          status: { not: ClassStatus.ARCHIVED },
        },
      },
      include: { class: true },
      orderBy: { scheduledStartAt: "asc" },
    });

    return res.json(
      sessions.map((s) => ({
        id: s.id,
        classId: s.classId,
        scheduledStartAt: s.scheduledStartAt,
        scheduledEndAt: s.scheduledEndAt,
        status: s.status,
        classTitle: s.class?.title ?? "",
        locationType: s.class?.locationType,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/student", authGuard([UserRole.STUDENT]), async (req, res) => {
  try {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ message: "Student profile not found" });

    const activeBookings = await prisma.booking.findMany({
      where: {
        studentId: student.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
      },
      select: { classId: true },
    });
    const classIds = Array.from(new Set(activeBookings.map((b) => b.classId)));
    if (classIds.length === 0) {
      return res.json([]);
    }

    const now = new Date();
    const sessions = await prisma.session.findMany({
      where: {
        status: { not: SS.CANCELLED as any },
        scheduledEndAt: { gte: now },
        classId: { in: classIds },
        class: {
          isDeleted: false,
          status: { not: ClassStatus.ARCHIVED },
        },
      },
      include: { class: true },
      orderBy: { scheduledStartAt: "asc" },
    });

    return res.json(
      sessions.map((s) => ({
        id: s.id,
        classId: s.classId,
        scheduledStartAt: s.scheduledStartAt,
        scheduledEndAt: s.scheduledEndAt,
        status: s.status,
        classTitle: s.class?.title ?? "",
        locationType: s.class?.locationType,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
