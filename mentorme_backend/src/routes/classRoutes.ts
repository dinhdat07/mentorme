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
import { refundEscrow } from "../services/escrow";

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

const recurrenceSlotSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6, { message: "dayOfWeek must be 0-6" }),
    startMinute: z.coerce.number().int().min(0).max(1440, { message: "startMinute must be 0-1440" }),
    endMinute: z.coerce.number().int().min(1).max(1440, { message: "endMinute must be 1-1440" }),
  })
  .refine((val) => val.endMinute > val.startMinute, { message: "endMinute must be greater than startMinute" });

const startDateSchema = z
  .string()
  .min(8, "recurrence.startDate is required")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: "recurrence.startDate must be a valid date" });

const scheduleCreateSchema = z
  .object({
    timezone: z.string().min(1, "timezone is required").default("UTC"),
    recurrence: z
      .object({
        startDate: startDateSchema,
        weeks: z.coerce.number().int().min(1).max(52),
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

type DateParts = { year: number; month: number; day: number };
const pad = (n: number) => n.toString().padStart(2, "0");
const parseDateParts = (value: string): DateParts | null => {
  const datePart = value.split("T")[0];
  const [y, m, d] = datePart.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
};
const addDays = (parts: DateParts, days: number): DateParts => {
  const dt = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
};
const datePartsToString = (parts: DateParts) => `${parts.year.toString().padStart(4, "0")}-${pad(parts.month)}-${pad(parts.day)}`;
const getOffsetMinutes = (date: Date, timeZone: string) => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
};

const getDayInTimezone = (parts: DateParts, timeZone: string) => {
  // Use midday to avoid DST edge cases for day calculation
  const guessUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  const offset = getOffsetMinutes(guessUtc, timeZone);
  const localMillis = guessUtc.getTime() - offset * 60_000;
  return new Date(localMillis).getUTCDay();
};

const localMinutesToUtcDate = (parts: DateParts, minuteOfDay: number, timeZone: string) => {
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hours, minutes, 0));
  const offset = getOffsetMinutes(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset * 60_000);
};

const toSessionInputs = (payload: z.infer<typeof scheduleCreateSchema>): SessionInput[] => {
  const sessions: SessionInput[] = [];
  if (payload.recurrence) {
    const tz = (payload.timezone || "UTC").trim() || "UTC";
    const startParts = parseDateParts(payload.recurrence.startDate);
    if (!startParts) {
      return [];
    }
    const baseDay = getDayInTimezone(startParts, tz);
    for (let week = 0; week < payload.recurrence.weeks; week++) {
      payload.recurrence.slots.forEach((slot) => {
        if (slot.endMinute <= slot.startMinute) return;
        const dayOffset = ((slot.dayOfWeek - baseDay + 7) % 7) + week * 7;
        const targetDate = addDays(startParts, dayOffset);
        const start = localMinutesToUtcDate(targetDate, slot.startMinute, tz);
        const end = localMinutesToUtcDate(targetDate, slot.endMinute, tz);
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

const cancelSchema = z.object({
  reason: z.string().optional(),
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

router.patch("/:id/cancel", authGuard([UserRole.TUTOR, UserRole.ADMIN]), async (req, res) => {
  try {
    cancelSchema.parse(req.body || {});
    const classId = req.params.id ?? "";
    if (!classId) return res.status(400).json({ message: "Class id required" });
    const classListing = await prisma.class.findUnique({ where: { id: classId } });
    if (!classListing || classListing.isDeleted) return res.status(404).json({ message: "Class not found" });

    if (req.user!.role === UserRole.TUTOR) {
      const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } });
      if (!tutor || tutor.id !== classListing.tutorId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (classListing.lifecycleStatus === CL.CANCELLED) {
      return res.status(400).json({ message: "Class already cancelled" });
    }

    await prisma.class.update({
      where: { id: classListing.id },
      data: {
        lifecycleStatus: CL.CANCELLED as any,
        status: ClassStatus.ARCHIVED,
      },
    });

    await refundEscrow(prisma, classListing.id);

    return res.json({ message: "Class cancelled" });
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

    const [schedule, sessions, cls] = await Promise.all([
      prisma.classSchedule.findUnique({
        where: { classId },
      }),
      prisma.session.findMany({
        where: { classId },
        orderBy: { scheduledStartAt: "asc" },
      }),
      prisma.class.findUnique({ where: { id: classId } }),
    ]);

    if (!schedule) {
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
      class: cls
        ? {
            id: cls.id,
            title: cls.title,
            lifecycleStatus: (cls as any).lifecycleStatus,
            totalSessions: (cls as any).totalSessions,
            sessionsCompleted: (cls as any).sessionsCompleted,
          }
        : null,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete(
  "/:id/schedule",
  authGuard([UserRole.TUTOR, UserRole.ADMIN]),
  async (req, res) => {
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

      if (req.user!.role === UserRole.TUTOR) {
        const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } });
        if (!tutor || tutor.id !== classListing.tutorId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // keep completed sessions for history; clear others
        await tx.session.deleteMany({
          where: {
            classId,
            status: { not: SS.COMPLETED as any },
          },
        });

        const completedCount = await tx.session.count({
          where: { classId, status: SS.COMPLETED as any },
        });

        await tx.classSchedule.deleteMany({ where: { classId } });
        await tx.class.update({
          where: { id: classId },
          data: {
            totalSessions: completedCount,
            sessionsCompleted: completedCount,
            lifecycleStatus:
              completedCount > 0 && classListing.totalSessions > 0 && completedCount >= (classListing.totalSessions ?? 0)
                ? (CL.COMPLETED as any)
                : completedCount > 0
                  ? (CL.ACTIVE as any)
                  : (CL.PENDING as any),
          },
        });

        const remainingSessions = await tx.session.findMany({
          where: { classId },
          orderBy: { scheduledStartAt: "asc" },
        });
        return { completedCount, remainingSessions };
      });

      return res.json({ message: "Schedule cleared", remainingSessions: result.remainingSessions });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

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
      const timezone = (payload.timezone || "UTC").trim() || "UTC";

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

      let sessions: SessionInput[] = [];
      try {
        sessions = toSessionInputs({ ...payload, timezone });
      } catch (err: any) {
        return res.status(400).json({ message: err?.message || "Invalid schedule payload" });
      }
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
        timezone,
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
        return res.status(400).json({
          message: "Invalid schedule payload",
          issues: error.issues?.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
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
