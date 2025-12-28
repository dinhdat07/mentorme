import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authGuard } from "../middleware/auth";
import { BookingStatus, ClassLifecycleStatus, SessionStatus, UserRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";
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

const START_WINDOW_MINUTES_BEFORE = 15;
const START_WINDOW_MINUTES_AFTER = 60;
const DISPUTE_HOURS = 6;

const startSchema = z.object({});
const completeSchema = z.object({});

const getSessionWithClass = async (id: string) => {
  return prisma.session.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          tutor: { select: { id: true, userId: true, verificationStatus: true } },
          bookings: {
            where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] } },
            include: { student: { select: { id: true, userId: true } } },
          },
        },
      },
    },
  });
};

const ensureActorAllowed = async (req: any, session: any) => {
  if (!session.class) return false;
  if (req.user!.role === UserRole.TUTOR) {
    const tutor = await prisma.tutorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!tutor || tutor.id !== session.class.tutorId) return false;
    if (tutor.verificationStatus !== VS.VERIFIED) return false;
    return true;
  }
  if (req.user!.role === UserRole.STUDENT) {
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!student) return false;
    const hasBooking = session.class.bookings.some((b: any) => (b.studentId ?? b.student?.id) === student.id);
    return hasBooking;
  }
  return false;
};

const withinStartWindow = (session: any) => {
  const start = new Date(session.scheduledStartAt).getTime();
  const now = Date.now();
  const from = start - START_WINDOW_MINUTES_BEFORE * 60 * 1000;
  const to = start + START_WINDOW_MINUTES_AFTER * 60 * 1000;
  return now >= from && now <= to;
};

const canComplete = (session: any) => {
  const now = Date.now();
  const end = new Date(session.scheduledEndAt).getTime();
  if (now < end) return false;
  if (session.status === SS.CANCELLED || session.status === SS.MISSED) return false;
  return true;
};

const maybeFlagDispute = (session: any, updates: Record<string, any>) => {
  const startConfirms = [
    updates.tutorStartConfirmedAt ?? session.tutorStartConfirmedAt,
    updates.studentStartConfirmedAt ?? session.studentStartConfirmedAt,
  ].filter(Boolean);
  const completeConfirms = [
    updates.tutorCompleteConfirmedAt ?? session.tutorCompleteConfirmedAt,
    updates.studentCompleteConfirmedAt ?? session.studentCompleteConfirmedAt,
  ].filter(Boolean);

  const firstStart = startConfirms.length === 1 ? startConfirms[0] : null;
  const firstComplete = completeConfirms.length === 1 ? completeConfirms[0] : null;

  const now = new Date();
  if (!session.disputeFlaggedAt) {
    if (firstStart) {
      const diffHours = (now.getTime() - new Date(firstStart).getTime()) / (1000 * 60 * 60);
      if (diffHours >= DISPUTE_HOURS) {
        updates.disputeFlaggedAt = now;
      }
    }
    if (!updates.disputeFlaggedAt && firstComplete) {
      const diffHours = (now.getTime() - new Date(firstComplete).getTime()) / (1000 * 60 * 60);
      if (diffHours >= DISPUTE_HOURS) {
        updates.disputeFlaggedAt = now;
      }
    }
  }
};

router.patch("/:id/start", authGuard([UserRole.TUTOR, UserRole.STUDENT]), async (req, res) => {
  try {
    startSchema.parse(req.body || {});
    const session = await getSessionWithClass(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!(await ensureActorAllowed(req, session))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!withinStartWindow(session)) {
      return res.status(400).json({ message: "Outside start window" });
    }

    const updates: any = {};
    const now = new Date();
    if (req.user!.role === UserRole.TUTOR) {
      updates.tutorStartConfirmedAt = session.tutorStartConfirmedAt ?? now;
    } else {
      updates.studentStartConfirmedAt = session.studentStartConfirmedAt ?? now;
    }

    const tutorConfirmed = updates.tutorStartConfirmedAt || session.tutorStartConfirmedAt;
    const studentConfirmed = updates.studentStartConfirmedAt || session.studentStartConfirmedAt;
    if (tutorConfirmed && studentConfirmed) {
      updates.status = SS.IN_PROGRESS;
      updates.startedAt = session.startedAt ?? now;
    }

    maybeFlagDispute(session, updates);

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: updates,
    });

    const tutorUserId = session.class?.tutor?.userId;
    const studentUserIds =
      session.class?.bookings?.map((b: any) => b.student?.userId).filter(Boolean) ?? [];

    // notify other party to confirm start
    if ((updates.tutorStartConfirmedAt && !studentConfirmed) && studentUserIds.length > 0) {
      for (const uid of studentUserIds) {
        await createNotification(prisma, {
          userId: uid,
          type: "SESSION_WAIT_START",
          title: "Xác nhận bắt đầu buổi học",
          body: "Gia sư đã xác nhận bắt đầu, vui lòng xác nhận.",
          metadata: { sessionId: session.id, classId: session.classId },
          dedupKey: `session:${session.id}:wait-start:${uid}`,
        });
      }
    }
    if ((updates.studentStartConfirmedAt && !tutorConfirmed) && tutorUserId) {
      await createNotification(prisma, {
        userId: tutorUserId,
        type: "SESSION_WAIT_START",
        title: "Xác nhận bắt đầu buổi học",
        body: "Học viên đã xác nhận bắt đầu, vui lòng xác nhận.",
        metadata: { sessionId: session.id, classId: session.classId },
        dedupKey: `session:${session.id}:wait-start:${tutorUserId}`,
      });
    }

    if (updates.status === SS.IN_PROGRESS) {
      const recipients = [...studentUserIds, tutorUserId].filter(Boolean) as string[];
      for (const uid of recipients) {
        await createNotification(prisma, {
          userId: uid,
          type: "SESSION_STARTED",
          title: "Buổi học đã bắt đầu",
          body: "Buổi học của bạn đã được bắt đầu.",
          metadata: { sessionId: session.id, classId: session.classId },
          dedupKey: `session:${session.id}:started:${uid}`,
        });
      }
    }

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/complete", authGuard([UserRole.TUTOR, UserRole.STUDENT]), async (req, res) => {
  try {
    completeSchema.parse(req.body || {});
    const session = await getSessionWithClass(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!(await ensureActorAllowed(req, session))) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!canComplete(session)) {
      return res.status(400).json({ message: "Cannot complete yet" });
    }

    const updates: any = {};
    const now = new Date();
    if (req.user!.role === UserRole.TUTOR) {
      updates.tutorCompleteConfirmedAt = session.tutorCompleteConfirmedAt ?? now;
    } else {
      updates.studentCompleteConfirmedAt = session.studentCompleteConfirmedAt ?? now;
    }

    const tutorConfirmed = updates.tutorCompleteConfirmedAt || session.tutorCompleteConfirmedAt;
    const studentConfirmed = updates.studentCompleteConfirmedAt || session.studentCompleteConfirmedAt;
    const shouldComplete = tutorConfirmed && studentConfirmed;

    maybeFlagDispute(session, updates);

    const result = await prisma.$transaction(async (tx) => {
      let newStatus = session.status;
      let completedAt = session.completedAt;
      let classProgressUpdated = false;

      if (shouldComplete && session.status !== SS.COMPLETED) {
        newStatus = SS.COMPLETED;
        completedAt = completedAt ?? now;
      }

      const updatedSession = await tx.session.update({
        where: { id: session.id },
        data: {
          ...updates,
          status: newStatus,
          startedAt: session.startedAt ?? now,
          completedAt,
        },
      });

      if (newStatus === SS.COMPLETED && session.status !== SS.COMPLETED) {
        await tx.class.update({
          where: { id: session.classId },
          data: {
            sessionsCompleted: { increment: 1 },
          },
        });
        classProgressUpdated = true;

        const cls = await tx.class.findUnique({ where: { id: session.classId } });
        const total = cls?.totalSessions ?? 0;
        if (cls && total > 0 && (cls.sessionsCompleted + 1) >= total) {
          await tx.class.update({
            where: { id: cls.id },
            data: { lifecycleStatus: CL.COMPLETED as any },
          });
        }
      }

      return updatedSession;
    });

    const tutorUserId = session.class?.tutor?.userId;
    const studentUserIds =
      session.class?.bookings?.map((b: any) => b.student?.userId).filter(Boolean) ?? [];

    if (updates.tutorCompleteConfirmedAt && !studentConfirmed && studentUserIds.length > 0) {
      for (const uid of studentUserIds) {
        await createNotification(prisma, {
          userId: uid,
          type: "SESSION_WAIT_COMPLETE",
          title: "Xác nhận hoàn thành buổi học",
          body: "Gia sư đã xác nhận hoàn thành, vui lòng xác nhận.",
          metadata: { sessionId: session.id, classId: session.classId },
          dedupKey: `session:${session.id}:wait-complete:${uid}`,
        });
      }
    }
    if (updates.studentCompleteConfirmedAt && !tutorConfirmed && tutorUserId) {
      await createNotification(prisma, {
        userId: tutorUserId,
        type: "SESSION_WAIT_COMPLETE",
        title: "Xác nhận hoàn thành buổi học",
        body: "Học viên đã xác nhận hoàn thành, vui lòng xác nhận.",
        metadata: { sessionId: session.id, classId: session.classId },
        dedupKey: `session:${session.id}:wait-complete:${tutorUserId}`,
      });
    }

    if (result.status === SS.COMPLETED) {
      const recipients = [...studentUserIds, tutorUserId].filter(Boolean) as string[];
      for (const uid of recipients) {
        await createNotification(prisma, {
          userId: uid,
          type: "SESSION_COMPLETED",
          title: "Buổi học đã hoàn thành",
          body: "Buổi học của bạn đã hoàn thành.",
          metadata: { sessionId: session.id, classId: session.classId },
          dedupKey: `session:${session.id}:completed:${uid}`,
        });
      }
    }

    if (result.disputeFlaggedAt && !session.disputeFlaggedAt) {
      const adminUsers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      const recipients = [
        tutorUserId,
        ...studentUserIds,
        ...adminUsers.map((a) => a.id),
      ].filter(Boolean) as string[];
      for (const uid of recipients) {
        await createNotification(prisma, {
          userId: uid,
          type: "SESSION_DISPUTE",
          title: "Phiên học cần xem xét",
          body: "Buổi học bị đánh dấu cần xem xét.",
          metadata: { sessionId: session.id, classId: session.classId },
          dedupKey: `session:${session.id}:dispute:${uid}`,
        });
      }
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
