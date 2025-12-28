import {
  BookingStatus,
  ClassStatus,
  PrismaClient,
  SessionStatus,
} from "@prisma/client";

const SS =
  SessionStatus ?? {
    SCHEDULED: "SCHEDULED",
    CANCELLED: "CANCELLED",
    MISSED: "MISSED",
  };

export type SessionInput = { start: Date; end: Date };

export function overlaps(a: SessionInput, b: SessionInput): boolean {
  return a.start < b.end && a.end > b.start;
}

export function normalizeSessions(sessions: SessionInput[]): SessionInput[] {
  const unique = new Map<string, SessionInput>();
  sessions.forEach((s) => {
    const key = `${s.start.toISOString()}|${s.end.toISOString()}`;
    if (!unique.has(key)) unique.set(key, s);
  });
  return Array.from(unique.values());
}

export async function checkScheduleConflicts(
  prisma: PrismaClient,
  opts: {
    classId: string;
    tutorId: string;
    studentIds: string[];
    sessions: SessionInput[];
  }
) {
  const { classId, tutorId, studentIds, sessions } = opts;
  if (sessions.length === 0) return null;

  const overlapConditions = sessions.map((s) => ({
    AND: [
      { scheduledStartAt: { lt: s.end } },
      { scheduledEndAt: { gt: s.start } },
    ],
  }));

  // Tutor conflicts (other classes)
  const tutorConflicts = await prisma.session.findMany({
    where: {
      status: { not: SS.CANCELLED as any },
      class: {
        tutorId,
        id: { not: classId },
        isDeleted: false,
        status: { not: ClassStatus.ARCHIVED },
      },
      OR: overlapConditions,
    },
    include: { class: true },
    take: 1,
  });
  if (tutorConflicts.length > 0) {
    const c = tutorConflicts[0];
    return {
      type: "tutor_conflict" as const,
      conflict: {
        start: c.scheduledStartAt,
        end: c.scheduledEndAt,
        classId: c.classId,
      },
    };
  }

  // Student conflicts
  if (studentIds.length > 0) {
    const studentConflicts = await prisma.session.findMany({
      where: {
        status: { not: SS.CANCELLED as any },
        class: {
          id: { not: classId },
          isDeleted: false,
          status: { not: ClassStatus.ARCHIVED },
          bookings: {
            some: {
              studentId: { in: studentIds },
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.TRIAL] },
            },
          },
        },
        OR: overlapConditions,
      },
      include: { class: true },
      take: 1,
    });
    if (studentConflicts.length > 0) {
      const c = studentConflicts[0];
      return {
        type: "student_conflict" as const,
        conflict: {
          start: c.scheduledStartAt,
          end: c.scheduledEndAt,
          classId: c.classId,
        },
      };
    }
  }

  // Tutor unavailability
  const unavailable = await prisma.tutorUnavailability.findMany({
    where: {
      tutorId,
      OR: sessions.map((s) => ({
        AND: [{ startAt: { lt: s.end } }, { endAt: { gt: s.start } }],
      })),
    },
    take: 1,
  });
  if (unavailable.length > 0) {
    const u = unavailable[0];
    return {
      type: "unavailable" as const,
      conflict: {
        start: u.startAt,
        end: u.endAt,
      },
    };
  }

  return null;
}
