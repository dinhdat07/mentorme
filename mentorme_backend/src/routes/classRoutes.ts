import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middleware/auth";
import {
  BookingStatus,
  ClassStatus,
  ClassLifecycleStatus,
  LocationType,
  Prisma,
  UserRole,
  UserStatus,
  VerificationStatus,
  SessionStatus,
} from "@prisma/client";
import { z } from "zod";
import { maskNationalId, sanitizeTutorForPublic } from "../utils/tutorSanitizer";
import { checkScheduleConflicts, normalizeSessions, SessionInput } from "../services/scheduling";
import { createNotification } from "../services/notifications";

const router = Router();
const VS =
  VerificationStatus ?? {
    UNVERIFIED: "UNVERIFIED",
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  };
const SS =
  SessionStatus ?? {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    MISSED: "MISSED",
  };
const CL =
  ClassLifecycleStatus ?? {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

const listSchema = z.object({
  tutorId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/", async (req, res) => {
  try {
    const query = listSchema.parse(req.query);
    const where: Prisma.ClassWhereInput = {
      status: query.status ?? ClassStatus.PUBLISHED,
      tutor: {
        verificationStatus: (VerificationStatus ?? {}).VERIFIED ?? VerificationStatus.VERIFIED,
        user: { status: UserStatus.ACTIVE },
      },
    };
    if (!query.includeDeleted) {
      where.isDeleted = false;
    }
    if (query.tutorId) where.tutorId = query.tutorId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.city) where.city = query.city;
    if (query.district) where.district = query.district;

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    return res.json({
      data: items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid filters", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const baseClassSchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  targetGrade: z.string().optional(),
  pricePerHour: z.number().min(0),
  locationType: z.nativeEnum(LocationType),
  city: z.string().optional(),
  district: z.string().optional(),
});

const recurrenceSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(1).max(1440),
});

const scheduleCreateSchema = z
  .object({
    timezone: z.string().min(1).default("UTC"),
    recurrence: z
      .object({
        startDate: z.string().datetime(),
        weeks: z.number().int().min(1).max(52),
        slots: z.array(recurrenceSlotSchema).min(1),
      })
      .optional(),
    explicitSessions: z
      .array(
        z.object({
          startAt: z.string().datetime(),
          endAt: z.string().datetime(),
        })
      )
      .optional(),
  })
  .refine(
    (val) =>
      (val.recurrence && val.recurrence.slots.length > 0) ||
      (val.explicitSessions && val.explicitSessions.length > 0),
    { message: "Provide recurrence or explicit sessions" }
  );

const toSessionInputs = (payload: z.infer<typeof scheduleCreateSchema>): SessionInput[] => {
  const sessions: SessionInput[] = [];
  if (payload.recurrence) {
    const base = new Date(payload.recurrence.startDate);
    const baseStartOfDay = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
    const baseDay = base.getUTCDay();
    for (let week = 0; week < payload.recurrence.weeks; week++) {
      payload.recurrence.slots.forEach((slot) => {
        if (slot.endMinute <= slot.startMinute) return;
        const dayOffset = ((slot.dayOfWeek - baseDay + 7) % 7) + week * 7;
        const start = new Date(baseStartOfDay + dayOffset * 24 * 60 * 60 * 1000 + slot.startMinute * 60 * 1000);
        const end = new Date(baseStartOfDay + dayOffset * 24 * 60 * 60 * 1000 + slot.endMinute * 60 * 1000);
        sessions.push({ start, end });
      });
    }
  }

  if (payload.explicitSessions) {
    payload.explicitSessions.forEach((s) => {
      const start = new Date(s.startAt);
      const end = new Date(s.endAt);
      if (end > start) {
        sessions.push({ start, end });
      }
    });
  }

  return normalizeSessions(
    sessions.filter((s) => s.start < s.end)
  );
};

router.post("/", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = baseClassSchema.parse(req.body);

    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tutor) {
      return res.status(400).json({ message: "Tutor profile not found" });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: payload.subjectId },
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const classListing = await prisma.class.create({
      data: {
        tutorId: tutor.id,
        subjectId: payload.subjectId,
        title: payload.title,
        description: payload.description,
        targetGrade: payload.targetGrade ?? null,
        pricePerHour: payload.pricePerHour,
        locationType: payload.locationType,
        city: payload.city ?? null,
        district: payload.district ?? null,
      },
    });

    return res.status(201).json(classListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const updateSchema = baseClassSchema.partial();

router.patch("/:id", authGuard([UserRole.TUTOR]), async (req, res) => {
  try {
    const payload = updateSchema.parse(req.body);

    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }

    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    const tutor = await prisma.tutorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tutor || classListing.tutorId !== tutor.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data: Prisma.ClassUpdateInput = {};
    if (payload.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: payload.subjectId } });
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      data.subject = { connect: { id: payload.subjectId } };
    }
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.targetGrade !== undefined) data.targetGrade = payload.targetGrade ?? null;
    if (payload.pricePerHour !== undefined) data.pricePerHour = payload.pricePerHour;
    if (payload.locationType !== undefined) data.locationType = payload.locationType;
    if (payload.city !== undefined) data.city = payload.city ?? null;
    if (payload.district !== undefined) data.district = payload.district ?? null;

    const updated = await prisma.class.update({
      where: { id: classListing.id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const statusSchema = z.object({
  status: z.nativeEnum(ClassStatus),
});

router.patch("/:id/status", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const payload = statusSchema.parse(req.body);
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const updated = await prisma.class.update({
      where: { id: classListing.id },
      data: { status: payload.status },
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classListing.status !== ClassStatus.ARCHIVED) {
      return res.status(400).json({ message: "Class must be archived before deletion" });
    }

    const activeBookings = await prisma.booking.count({
      where: {
        classId: classListing.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({ message: "Active bookings exist" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    await prisma.class.update({
      where: { id: classListing.id },
      data: { isDeleted: true },
    });

    return res.json({ message: "Class deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/students", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classListing) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const students = await prisma.booking.findMany({
      where: {
        classId: classListing.id,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL, BookingStatus.COMPLETED],
        },
      },
      include: {
        student: true,
      },
    });

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/sessions", authGuard(), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) return res.status(400).json({ message: "Class id required" });
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
      include: { tutor: true, schedule: true },
    });
    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }
    if (req.user?.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    if (req.user?.role === UserRole.STUDENT) {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (!student) return res.status(400).json({ message: "Student profile not found" });
      const booking = await prisma.booking.findFirst({
        where: {
          classId,
          studentId: student.id,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
        },
      });
      if (!booking) return res.status(403).json({ message: "Forbidden" });
    }

    const sessions = await prisma.session.findMany({
      where: { classId },
      orderBy: { scheduledStartAt: "asc" },
    });
    return res.json({
      class: {
        id: classListing.id,
        title: classListing.title,
        lifecycleStatus: classListing.lifecycleStatus,
        totalSessions: classListing.totalSessions,
        sessionsCompleted: classListing.sessionsCompleted,
      },
      schedule: classListing.schedule,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/schedule", authGuard(), async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }

    const schedule = await prisma.classSchedule.findUnique({
      where: { classId },
      include: {
        sessions: {
          orderBy: { scheduledStartAt: "asc" },
        },
        class: true,
      },
    });

    if (!schedule) {
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      return res.json({ schedule: null, sessions: [], class: cls });
    }

    return res.json({
      schedule: {
        id: schedule.id,
        classId: schedule.classId,
        timezone: schedule.timezone,
        recurrenceRule: schedule.recurrenceRule,
        explicitSessions: schedule.explicitSessions,
        totalSessions: schedule.totalSessions,
      },
      class: schedule.class
        ? {
            id: schedule.class.id,
            title: schedule.class.title,
            lifecycleStatus: (schedule.class as any).lifecycleStatus,
            totalSessions: (schedule.class as any).totalSessions,
            sessionsCompleted: (schedule.class as any).sessionsCompleted,
          }
        : null,
      sessions: schedule.sessions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/:id/schedule",
  authGuard([UserRole.TUTOR, UserRole.ADMIN]),
  async (req, res) => {
    try {
      const classId = req.params.id ?? "";
      if (!classId) {
        return res.status(400).json({ message: "Class id required" });
      }

      const payload = scheduleCreateSchema.parse(req.body);

      const classListing = await prisma.class.findUnique({
        where: { id: classId },
        include: { tutor: true },
      });
      if (!classListing || classListing.isDeleted) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (req.user!.role === UserRole.TUTOR) {
        const tutor = await prisma.tutorProfile.findUnique({
          where: { userId: req.user!.id },
        });
        if (!tutor || tutor.id !== classListing.tutorId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (tutor.verificationStatus !== VS.VERIFIED) {
          return res
            .status(403)
            .json({ message: "Tutor must be verified before scheduling" });
        }
      }

      const sessions = toSessionInputs(payload);
      if (sessions.length === 0) {
        return res.status(400).json({ message: "No valid sessions generated" });
      }

      const bookings = await prisma.booking.findMany({
        where: {
          classId: classListing.id,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
        },
        include: { student: { select: { id: true, userId: true } } },
      });
      const studentIds = Array.from(new Set(bookings.map((b) => b.studentId ?? b.student?.id).filter(Boolean))) as string[];
      const studentUserIds = bookings.map((b) => b.student?.userId).filter(Boolean) as string[];

      const conflict = await checkScheduleConflicts(prisma, {
        classId: classListing.id,
        tutorId: classListing.tutorId,
        studentIds,
        sessions,
      });
      if (conflict) {
        return res.status(409).json({
          message: "Scheduling conflict detected",
          type: conflict.type,
          conflict: conflict.conflict,
        });
      }

      const scheduleData = {
        timezone: payload.timezone,
        recurrenceRule: payload.recurrence ?? null,
        explicitSessions: payload.explicitSessions ?? null,
        totalSessions: sessions.length,
      };

    const createdSessions = sessions.map((s) => ({
      classId: classListing.id,
      scheduledStartAt: s.start,
      scheduledEndAt: s.end,
      status: SS.SCHEDULED as any,
    }));

      const result = await prisma.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { classId: classListing.id } });
        const schedule = await tx.classSchedule.upsert({
          where: { classId: classListing.id },
          update: {
          ...scheduleData,
        },
        create: {
          classId: classListing.id,
          ...scheduleData,
        },
      });

      if (createdSessions.length > 0) {
        await tx.session.createMany({ data: createdSessions });
      }

      await tx.class.update({
        where: { id: classListing.id },
        data: {
          totalSessions: createdSessions.length,
          sessionsCompleted: 0,
          lifecycleStatus: CL.ACTIVE as any,
        },
      });

      const sessionsData = await tx.session.findMany({
        where: { classId: classListing.id },
        orderBy: { scheduledStartAt: "asc" },
      });

        return { schedule, sessionsData };
      });

      const tutorUserId = classListing.tutor?.userId;
      const recipients = [
        tutorUserId,
        ...studentUserIds,
      ].filter(Boolean) as string[];
      for (const uid of recipients) {
        await createNotification(prisma, {
          userId: uid,
          type: "SCHEDULE_CREATED",
          title: "Lịch học đã được cập nhật",
          body: "Lịch học của lớp đã được tạo hoặc cập nhật.",
          metadata: { classId: classListing.id, scheduleId: result.schedule.id },
          dedupKey: `class:${classListing.id}:schedule:${uid}`,
        });
      }

      return res.status(200).json({
        schedule: result.schedule,
        sessions: result.sessionsData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule payload", issues: error.issues });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const classId = req.params.id ?? "";
    if (!classId) {
      return res.status(400).json({ message: "Class id required" });
    }
    const classListing = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        tutor: true,
        subject: true,
      },
    });

    if (!classListing || classListing.isDeleted) {
      return res.status(404).json({ message: "Class not found" });
    }

    const result = { ...classListing } as any;
    if (result.tutor) {
      result.tutor = sanitizeTutorForPublic(result.tutor, { maskNationalId });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
