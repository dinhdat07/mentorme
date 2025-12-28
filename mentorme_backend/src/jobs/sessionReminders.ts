import { prisma } from "../lib/prisma";
import { ReminderType, SessionStatus } from "@prisma/client";
import { createReminderIfNeeded } from "../services/notifications";

const SS =
  SessionStatus ?? {
    SCHEDULED: "SCHEDULED",
  };
const RT =
  ReminderType ?? {
    REMINDER_24H: "REMINDER_24H",
    REMINDER_1H: "REMINDER_1H",
  };

const windowMinutes = 5;

const isWithinWindow = (target: Date, minutesFromNow: number) => {
  const now = Date.now();
  const targetTime = target.getTime();
  const min = minutesFromNow * 60 * 1000;
  return targetTime >= now + (minutesFromNow - windowMinutes) * 60 * 1000 &&
    targetTime <= now + (minutesFromNow + windowMinutes) * 60 * 1000;
};

export async function runSessionReminderJob(client = prisma) {
  const now = new Date();
  const sessions = await client.session.findMany({
    where: {
      status: SS.SCHEDULED as any,
      scheduledStartAt: {
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      },
    },
    include: {
      class: {
        include: {
          tutor: true,
          bookings: {
            where: { status: { not: "CANCELLED" } },
            select: { studentId: true },
          },
        },
      },
    },
  });

  for (const session of sessions) {
    const start = new Date(session.scheduledStartAt);
    const shouldSend24h = isWithinWindow(start, 24 * 60);
    const shouldSend1h = isWithinWindow(start, 60);

    if (!shouldSend24h && !shouldSend1h) continue;
    const classId = session.classId;
    const tutorId = session.class?.tutor?.userId;
    const studentIds = session.class?.bookings?.map((b) => b.studentId) ?? [];
    const studentProfiles = await client.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { userId: true, id: true },
    });
    const recipients = [
      tutorId,
      ...studentProfiles.map((s) => s.userId),
    ].filter(Boolean) as string[];

    for (const userId of recipients) {
      if (shouldSend24h) {
        await createReminderIfNeeded(client, {
          userId,
          sessionId: session.id,
          reminderType: RT.REMINDER_24H as any,
          title: "Nhắc lịch học trong 24h",
          body: `Buổi học sẽ bắt đầu lúc ${start.toISOString()} (class ${classId})`,
        });
      }
      if (shouldSend1h) {
        await createReminderIfNeeded(client, {
          userId,
          sessionId: session.id,
          reminderType: RT.REMINDER_1H as any,
          title: "Nhắc lịch học trong 1h",
          body: `Buổi học sẽ bắt đầu lúc ${start.toISOString()} (class ${classId})`,
        });
      }
    }
  }
}

if (require.main === module) {
  runSessionReminderJob()
    .then(() => {
      console.log("Reminder job done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Reminder job failed", err);
      process.exit(1);
    });
}
