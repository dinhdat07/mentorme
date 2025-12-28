import request from "supertest";
import app from "../../src/app";
import { mockPrisma } from "../utils/mockPrisma";
import { signToken } from "../../src/utils/jwt";
import { BookingStatus, ClassStatus, UserRole } from "@prisma/client";

const tutorToken = signToken({ userId: "user-tutor", role: UserRole.TUTOR });
const studentToken = signToken({ userId: "user-student", role: UserRole.STUDENT });

describe("Scheduling & calendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseClass = {
    id: "class-1",
    tutorId: "tutor-1",
    isDeleted: false,
    status: ClassStatus.PUBLISHED,
  };

  const baseSchedulePayload = {
    timezone: "UTC",
    recurrence: {
      startDate: "2025-01-06T00:00:00.000Z",
      weeks: 1,
      slots: [{ dayOfWeek: 1, startMinute: 600, endMinute: 660 }],
    },
  };
  const baseClassRecord = { ...baseClass };

  test("schedule creation succeeds without conflicts", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClassRecord });
    mockPrisma.class.update.mockResolvedValue({ ...baseClassRecord, totalSessions: 1, sessionsCompleted: 0 } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany
      .mockResolvedValueOnce([]) // tutor conflict check
      .mockResolvedValueOnce([]) // student conflict check
      .mockResolvedValueOnce([
        {
          id: "sess-1",
          classId: "class-1",
          scheduledStartAt: new Date("2025-01-06T10:00:00.000Z"),
          scheduledEndAt: new Date("2025-01-06T11:00:00.000Z"),
          status: "SCHEDULED",
        },
      ] as any);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);
    mockPrisma.classSchedule.upsert.mockResolvedValue({
      id: "sched-1",
      classId: "class-1",
      totalSessions: 1,
      timezone: "UTC",
    } as any);
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockPrisma.session.createMany.mockResolvedValue({ count: 1 } as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma as any));

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send(baseSchedulePayload);

    expect(res.status).toBe(200);
    expect(mockPrisma.session.createMany).toHaveBeenCalled();
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });

  test("tutor conflict returns 409", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClass });
    mockPrisma.class.update.mockResolvedValue({ ...baseClass } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany.mockResolvedValueOnce([
      {
        id: "other-session",
        classId: "class-2",
        scheduledStartAt: new Date("2025-01-06T10:30:00.000Z"),
        scheduledEndAt: new Date("2025-01-06T11:30:00.000Z"),
        status: "SCHEDULED",
        class: { id: "class-2" },
      },
    ] as any);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send(baseSchedulePayload);

    expect(res.status).toBe(409);
    expect(res.body.type).toBe("tutor_conflict");
  });

  test("student conflict returns 409", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClass });
    mockPrisma.class.update.mockResolvedValue({ ...baseClass } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([{ studentId: "student-1" }]);
    mockPrisma.session.findMany
      .mockResolvedValueOnce([]) // tutor conflicts
      .mockResolvedValueOnce([
        {
          id: "stud-session",
          classId: "class-9",
          scheduledStartAt: new Date("2025-01-06T10:30:00.000Z"),
          scheduledEndAt: new Date("2025-01-06T11:30:00.000Z"),
          status: "SCHEDULED",
          class: { id: "class-9" },
        },
      ] as any);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send(baseSchedulePayload);

    expect(res.status).toBe(409);
    expect(res.body.type).toBe("student_conflict");
  });

  test("unavailability conflict returns 409", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClass });
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany.mockResolvedValueOnce([]); // tutor conflicts
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([
      { startAt: new Date("2025-01-06T09:00:00.000Z"), endAt: new Date("2025-01-06T12:00:00.000Z") },
    ]);

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send(baseSchedulePayload);

    expect(res.status).toBe(409);
    expect(res.body.type).toBe("unavailable");
  });

  test("tutor calendar returns upcoming sessions", async () => {
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({ id: "tutor-1", userId: "user-tutor" });
    mockPrisma.session.findMany.mockResolvedValue([
      {
        id: "sess-1",
        classId: "class-1",
        scheduledStartAt: new Date("2025-01-06T10:00:00.000Z"),
        scheduledEndAt: new Date("2025-01-06T11:00:00.000Z"),
        status: "SCHEDULED",
        class: { id: "class-1", title: "Math", locationType: "ONLINE" },
      },
    ] as any);

    const res = await request(app)
      .get("/api/calendar/tutor")
      .set("Authorization", `Bearer ${tutorToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].classTitle).toBe("Math");
  });

  test("student conflict prevented across classes", async () => {
    mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: "student-1", userId: "user-student" });
    mockPrisma.booking.findMany.mockResolvedValue([{ classId: "class-1" }, { classId: "class-2" }]);
    mockPrisma.session.findMany.mockResolvedValue([
      {
        id: "sess-1",
        classId: "class-1",
        scheduledStartAt: new Date("2025-01-06T10:00:00.000Z"),
        scheduledEndAt: new Date("2025-01-06T11:00:00.000Z"),
        status: "SCHEDULED",
        class: { id: "class-1", title: "Math", locationType: "ONLINE" },
      },
    ] as any);

    const res = await request(app)
      .get("/api/calendar/student")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("recurrence payload with string numbers is accepted", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClassRecord });
    mockPrisma.class.update.mockResolvedValue({ ...baseClassRecord } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany
      .mockResolvedValueOnce([]) // tutor conflicts
      .mockResolvedValueOnce([
        {
          id: "sess-1",
          classId: "class-1",
          scheduledStartAt: new Date("2025-01-06T10:00:00.000Z"),
          scheduledEndAt: new Date("2025-01-06T11:00:00.000Z"),
          status: "SCHEDULED",
        },
      ] as any) // next call (student conflicts or transaction)
      .mockResolvedValue([
        {
          id: "sess-1",
          classId: "class-1",
          scheduledStartAt: new Date("2025-01-06T10:00:00.000Z"),
          scheduledEndAt: new Date("2025-01-06T11:00:00.000Z"),
          status: "SCHEDULED",
        },
      ] as any);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);
    mockPrisma.classSchedule.upsert.mockResolvedValue({ id: "sched-1", classId: "class-1", totalSessions: 1, timezone: "UTC" } as any);
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockPrisma.session.createMany.mockResolvedValue({ count: 1 } as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma as any));

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        timezone: "UTC",
        recurrence: {
          startDate: "2025-01-06T00:00:00.000Z",
          weeks: "2",
          slots: [{ dayOfWeek: "1", startMinute: "600", endMinute: "660" }],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });

  test("recurrence respects timezone (Asia/Ho_Chi_Minh 09:00-10:00 => 02:00-03:00 UTC)", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClassRecord });
    mockPrisma.class.update.mockResolvedValue({ ...baseClassRecord } as any);
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany
      .mockResolvedValueOnce([]) // tutor conflicts
      .mockResolvedValueOnce([]) // student conflicts
      .mockResolvedValueOnce([
        {
          id: "sess-1",
          classId: "class-1",
          scheduledStartAt: new Date("2025-01-06T02:00:00.000Z"),
          scheduledEndAt: new Date("2025-01-06T03:00:00.000Z"),
          status: "SCHEDULED",
        },
      ] as any);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);
    mockPrisma.classSchedule.upsert.mockResolvedValue({
      id: "sched-1",
      classId: "class-1",
      totalSessions: 1,
      timezone: "Asia/Ho_Chi_Minh",
    } as any);
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockPrisma.session.createMany.mockResolvedValue({ count: 1 } as any);
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma as any));

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        timezone: "Asia/Ho_Chi_Minh",
        recurrence: {
          startDate: "2025-01-06",
          weeks: 1,
          slots: [{ dayOfWeek: 1, startMinute: 540, endMinute: 600 }],
        },
      });

    expect(res.status).toBe(200);
    const created = (mockPrisma.session.createMany.mock.calls[0]?.[0]?.data?.[0] || {}) as any;
    expect(new Date(created.scheduledStartAt).toISOString()).toBe("2025-01-06T02:00:00.000Z");
    expect(new Date(created.scheduledEndAt).toISOString()).toBe("2025-01-06T03:00:00.000Z");
  });

  test("invalid recurrence returns clear message", async () => {
    mockPrisma.class.findUnique.mockResolvedValue({ ...baseClassRecord });
    mockPrisma.tutorProfile.findUnique.mockResolvedValue({
      id: "tutor-1",
      userId: "user-tutor",
      verificationStatus: "VERIFIED",
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.session.findMany.mockResolvedValue([]);
    mockPrisma.tutorUnavailability.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/classes/class-1/schedule")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        timezone: "",
        recurrence: {
          startDate: "invalid-date",
          weeks: 0,
          slots: [{ dayOfWeek: 9, startMinute: 600, endMinute: 500 }],
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.stringContaining("recurrence") }),
      ])
    );
  });
});
