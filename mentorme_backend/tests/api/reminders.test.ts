import { runSessionReminderJob } from "../../src/jobs/sessionReminders";
import { mockPrisma } from "../utils/mockPrisma";

describe("Session reminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T09:00:00.000Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("sends 24h and 1h reminders once", async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      {
        id: "s1",
        classId: "c1",
        scheduledStartAt: new Date("2025-01-02T09:00:00.000Z"),
        status: "SCHEDULED",
        class: {
          tutor: { userId: "tutor-user" },
          bookings: [{ studentId: "stu1" }],
        },
      },
    ] as any);
    mockPrisma.studentProfile.findMany.mockResolvedValue([{ id: "stu1", userId: "student-user" }]);
    mockPrisma.reminderLog.create.mockResolvedValue({ id: "r1" } as any);
    mockPrisma.notification.create.mockResolvedValue({ id: "n1" } as any);

    await runSessionReminderJob(mockPrisma as any);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);

    // second run should not duplicate due to P2002
    const dupErr: any = new Error("dup");
    dupErr.code = "P2002";
    mockPrisma.reminderLog.create.mockRejectedValue(dupErr);
    await runSessionReminderJob(mockPrisma as any);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
  });
});
