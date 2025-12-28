import { PrismaClient, ReminderType } from "@prisma/client";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  dedupKey: string;
};

export async function createNotification(prisma: PrismaClient, input: NotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata ?? null,
        dedupKey: input.dedupKey,
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      // dedup violation, ignore
      return null;
    }
    throw err;
  }
}

export async function createReminderIfNeeded(
  prisma: PrismaClient,
  opts: { userId: string; sessionId: string; reminderType: ReminderType; title: string; body: string }
) {
  try {
    await prisma.reminderLog.create({
      data: {
        userId: opts.userId,
        sessionId: opts.sessionId,
        reminderType: opts.reminderType,
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return null;
    }
    throw err;
  }
  return createNotification(prisma, {
    userId: opts.userId,
    type: "SESSION_REMINDER",
    title: opts.title,
    body: opts.body,
    metadata: { sessionId: opts.sessionId, reminderType: opts.reminderType },
    dedupKey: `session:${opts.sessionId}:reminder:${opts.reminderType}:${opts.userId}`,
  });
}
