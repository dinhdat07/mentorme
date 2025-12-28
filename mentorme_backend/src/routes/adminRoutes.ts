import { Router } from "express";
import { authGuard } from "../middleware/auth";
import {
  BookingStatus,
  ClassStatus,
  ClassLifecycleStatus,
  Prisma,
  UserRole,
  UserStatus,
  VerificationStatus,
  SessionStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { maskNationalId } from "../utils/tutorSanitizer";
import { createNotification } from "../services/notifications";

const router = Router();
const VerificationStatusEnum =
  VerificationStatus ?? {
    UNVERIFIED: "UNVERIFIED",
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  };

router.use(authGuard([UserRole.ADMIN]));

router.get("/tutors/pending", async (_req, res) => {
  try {
    const tutors = await prisma.tutorProfile.findMany({
      where: {
        verificationStatus: VerificationStatusEnum.PENDING,
        user: { status: { in: [UserStatus.PENDING, UserStatus.ACTIVE] } },
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return res.json(tutors);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const verifySchema = z.object({
  approved: z.boolean(),
  note: z.string().optional(),
});

const verificationFilterSchema = z.object({
  status: z.nativeEnum(VerificationStatusEnum).optional(),
});

const verificationDecisionSchema = z.object({
  note: z.string().optional(),
});

router.patch("/tutors/:id/verify", async (req, res) => {
  try {
    const payload = verifySchema.parse(req.body);
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    await prisma.$transaction([
      prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          verified: payload.approved,
          verificationStatus: payload.approved
            ? VerificationStatusEnum.VERIFIED
            : VerificationStatusEnum.REJECTED,
          verificationReviewedAt: new Date(),
          verificationNotes: payload.note ?? null,
          moderationNote: payload.note ?? null,
        },
      }),
      prisma.user.update({
        where: { id: tutor.userId },
        data: {
          status: payload.approved ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
        },
      }),
    ]);

    return res.json({ message: payload.approved ? "Tutor verified" : "Tutor rejected" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/tutor-verifications", async (req, res) => {
  try {
    const query = verificationFilterSchema.parse({ status: req.query.status });
    const where: Prisma.TutorProfileWhereInput = {};
    if (query.status) where.verificationStatus = query.status;

    const tutors = await prisma.tutorProfile.findMany({
      where,
      include: { user: true },
      orderBy: { verificationSubmittedAt: "desc" },
    });
    const sanitized = tutors.map((tutor) => ({
      ...tutor,
      nationalIdNumber: maskNationalId(tutor.nationalIdNumber),
    }));
    return res.json(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/tutor-verifications/:id", async (req, res) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    return res.json(tutor);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/tutor-verifications/:id/approve", async (req, res) => {
  try {
    const payload = verificationDecisionSchema.parse(req.body);
    const tutor = await prisma.tutorProfile.findUnique({ where: { id: req.params.id } });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    await prisma.$transaction([
      prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          verificationStatus: VerificationStatusEnum.VERIFIED,
          verificationReviewedAt: new Date(),
          verificationNotes: payload.note ?? null,
          verified: true,
        },
      }),
      prisma.user.update({
        where: { id: tutor.userId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    await createNotification(prisma, {
      userId: tutor.userId,
      type: "VERIFICATION_APPROVED",
      title: "Hồ sơ đã được duyệt",
      body: "Hồ sơ gia sư của bạn đã được phê duyệt.",
      metadata: { tutorId: tutor.id },
      dedupKey: `verification:${tutor.id}:approved`,
    });
    return res.json({ message: "Tutor verification approved" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/tutor-verifications/:id/reject", async (req, res) => {
  try {
    const payload = verificationDecisionSchema.parse(req.body);
    const tutor = await prisma.tutorProfile.findUnique({ where: { id: req.params.id } });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    await prisma.$transaction([
      prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          verificationStatus: VerificationStatusEnum.REJECTED,
          verificationReviewedAt: new Date(),
          verificationNotes: payload.note ?? null,
          verified: false,
        },
      }),
      prisma.user.update({
        where: { id: tutor.userId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    await createNotification(prisma, {
      userId: tutor.userId,
      type: "VERIFICATION_REJECTED",
      title: "Hồ sơ bị từ chối",
      body: "Hồ sơ gia sư của bạn bị từ chối, vui lòng cập nhật và gửi lại.",
      metadata: { tutorId: tutor.id },
      dedupKey: `verification:${tutor.id}:rejected`,
    });
    return res.json({ message: "Tutor verification rejected" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sessions/flagged", async (_req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { disputeFlaggedAt: { not: null } },
      orderBy: { disputeFlaggedAt: "desc" },
      include: {
        class: true,
      },
    });
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const banSchema = z.object({
  banned: z.boolean(),
});

router.patch("/tutors/:id/ban", async (req, res) => {
  try {
    const payload = banSchema.parse(req.body);
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    await prisma.user.update({
      where: { id: tutor.userId },
      data: {
        status: payload.banned ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      },
    });

    if (payload.banned) {
      await prisma.class.updateMany({
        where: { tutorId: tutor.id, isDeleted: false },
        data: { status: ClassStatus.ARCHIVED },
      });
    }

    return res.json({ message: payload.banned ? "Tutor banned" : "Tutor unbanned" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/students/:id/ban", async (req, res) => {
  try {
    const payload = banSchema.parse(req.body);
    const student = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        status: payload.banned ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      },
    });

    return res.json({ message: payload.banned ? "Student banned" : "Student unbanned" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const bookingFilterSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  tutorId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

router.get("/bookings", async (req, res) => {
  try {
    const query = bookingFilterSchema.parse({
      status: req.query.status,
      tutorId: req.query.tutorId,
      studentId: req.query.studentId,
      from: req.query.from,
      to: req.query.to,
    });

    const where: Prisma.BookingWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.tutorId) {
      where.tutorId = query.tutorId;
    }
    if (query.studentId) {
      where.studentId = query.studentId;
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        class: true,
        student: {
          include: { user: true },
        },
        tutor: {
          include: { user: true },
        },
      },
    });

    return res.json(bookings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const classFilterSchema = z.object({
  status: z.nativeEnum(ClassStatus).optional(),
  tutorId: z.string().uuid().optional(),
  city: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  includeDeleted: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional(),
});

router.get("/classes", async (req, res) => {
  try {
    const query = classFilterSchema.parse({
      status: req.query.status,
      tutorId: req.query.tutorId,
      city: req.query.city,
      subjectId: req.query.subjectId,
      includeDeleted: req.query.includeDeleted,
    });

    const where: Prisma.ClassWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.tutorId) {
      where.tutorId = query.tutorId;
    }
    if (query.city) {
      where.city = query.city;
    }
    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tutor: {
          include: { user: true },
        },
        subject: true,
      },
    });

    return res.json(classes);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
